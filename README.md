# Weather AI 🌤️

A modern, AI-powered weather application built with React, Tailwind CSS, and the OpenAI GPT API.

## 🌟 Features

*   **Real-Time Weather:** Get current temperature, conditions, humidity, wind speed, RealFeel, and Air Quality Index (AQI).
*   **8-Day Forecast:** Detailed daily forecasts including high/low temperatures and weather conditions.
*   **Hourly Breakdown:** Interactive area charts (powered by Recharts) showing temperature, precipitation chance, and wind speed throughout the day.
*   **Severe Weather Alerts:** Real-time warnings for storms, floods, extreme heat, and other severe conditions.
*   **Active Storm Tracker:** Dedicated UI for tracking active typhoons/storms, including category, distance, movement, and expected impact.
*   **Dynamic UI:** The application's background gradients and decorative animations change automatically based on the current weather conditions (e.g., rain, snow, clear skies).
*   **Interactive Radar:** Embedded Windy.com radar map with toggleable cloud and temperature overlays.
*   **Smart Search:** Autocomplete search functionality supporting all 63 provinces and cities in Vietnam.

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **AI/Data Source:** OpenAI API (`openai`) with GPT-4o Structured Outputs

## 🧠 How It Works (The AI Magic)

Unlike traditional weather applications that rely on standard REST APIs (like OpenWeatherMap or WeatherAPI), Weather AI leverages the power of **Large Language Models (LLMs)** to fetch and structure data.

1.  **User Input:** The user searches for a location (e.g., "Hanoi").
2.  **Prompt Generation:** The app constructs a detailed prompt requesting current weather, forecasts, and storm alerts for that specific location.
3.  **OpenAI API & Structured Outputs:** The prompt is sent to the `gpt-4o-2024-08-06` model. The model uses its vast knowledge base and reasoning capabilities to generate realistic weather data.
4.  **Structured Output:** The model is instructed to return the data strictly adhering to a predefined JSON schema (using `response_format: { type: "json_schema" }`).
5.  **Rendering:** The React frontend parses the guaranteed JSON structure and updates the beautiful, dynamic UI.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   An OpenAI API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd weather-ai
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_api_key_here
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:3000`.
