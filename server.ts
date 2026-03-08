import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/weather", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const prompt = `
        Get the current weather, 8-day forecast, and severe weather alerts for "${query}".
        For each day in the 8-day forecast, provide an hourly forecast (e.g., 11:00, 14:00, 17:00, 20:00, 23:00, 02:00, 05:00, 08:00).
        Also check if there is any active storm/typhoon near this location. If yes, provide its details in the stormForecast object.
        Include the exact latitude and longitude coordinates for the location.
        Include RealFeel, RealFeel Shade, Wind Gusts, and Air Quality (e.g., Good, Moderate, Unhealthy) for the current weather.
        If the user searches in unaccented/lowercase Vietnamese (e.g. "ha noi"), infer the correct city name.
        Translate all values to English. Ensure the "location" field uses the properly capitalized name (e.g., "Hanoi, Vietnam", "Tokyo, Japan").
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          { role: "system", content: "You are a helpful weather assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "weather_data",
            schema: {
              type: "object",
              properties: {
                location: { type: "string", description: "City Name, Country Name" },
                coordinates: {
                  type: "object",
                  properties: {
                    lat: { type: "number", description: "Latitude" },
                    lon: { type: "number", description: "Longitude" }
                  },
                  required: ["lat", "lon"],
                  additionalProperties: false
                },
                current: {
                  type: "object",
                  properties: {
                    temperature: { type: "string", description: "e.g., 25°C" },
                    condition: { type: "string", description: "Sunny | Cloudy | Partly Cloudy | Rain | Storm | Snow | Clear | Fog" },
                    humidity: { type: "string", description: "e.g., 45%" },
                    wind: { type: "string", description: "e.g., 12 km/h" },
                    precipitation: { type: "string", description: "e.g., 50%" },
                    realFeel: { type: "string", description: "e.g., 28°" },
                    realFeelShade: { type: "string", description: "e.g., 26°" },
                    windGusts: { type: "string", description: "e.g., 15 km/h" },
                    airQuality: { type: "string", description: "e.g., Good, Moderate, Unhealthy" }
                  },
                  required: ["temperature", "condition", "humidity", "wind", "precipitation", "realFeel", "realFeelShade", "windGusts", "airQuality"],
                  additionalProperties: false
                },
                forecast: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "Mon, Tue, Wed..." },
                      high: { type: "string", description: "e.g., 28°C" },
                      low: { type: "string", description: "e.g., 20°C" },
                      condition: { type: "string", description: "Sunny | Cloudy | Partly Cloudy | Rain | Storm | Snow | Clear | Fog" },
                      hourly: {
                        type: "array",
                        description: "Hourly forecast for this day (e.g., 11:00, 14:00, 17:00)",
                        items: {
                          type: "object",
                          properties: {
                            time: { type: "string", description: "e.g., 11:00, 14:00" },
                            temperature: { type: "number", description: "Numeric temperature value, e.g., 24" },
                            precipitation: { type: "number", description: "Numeric precipitation chance percentage, e.g., 50" },
                            wind: { type: "number", description: "Numeric wind speed in km/h, e.g., 12" },
                            condition: { type: "string", description: "Sunny | Cloudy | Partly Cloudy | Rain | Storm | Snow | Clear | Fog" }
                          },
                          required: ["time", "temperature", "precipitation", "wind", "condition"],
                          additionalProperties: false
                        }
                      }
                    },
                    required: ["day", "high", "low", "condition", "hourly"],
                    additionalProperties: false
                  }
                },
                alerts: {
                  type: "object",
                  properties: {
                    messages: {
                      type: "array",
                      items: { type: "string" }
                    },
                    type: { type: ["string", "null"], description: "storm, flood, rain, heat, snow, general, or null" }
                  },
                  required: ["messages", "type"],
                  additionalProperties: false
                },
                stormForecast: {
                  type: "object",
                  properties: {
                    active: { type: "boolean", description: "True if there is an active storm/typhoon near this location" },
                    name: { type: "string", description: "Name of the storm (if active)" },
                    category: { type: "string", description: "Category or intensity of the storm" },
                    distance: { type: "string", description: "Approximate distance from the location" },
                    direction: { type: "string", description: "Movement direction" },
                    impact: { type: "string", description: "Expected impact on the location" }
                  },
                  required: ["active"],
                  additionalProperties: false
                }
              },
              required: ["location", "coordinates", "current", "forecast"],
              additionalProperties: false
            },
            strict: true
          }
        }
      });

      const text = response.choices[0].message.content || '{}';
      const data = JSON.parse(text);
      res.json(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
