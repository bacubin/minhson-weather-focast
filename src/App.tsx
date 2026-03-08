/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Wind, Droplets, Sun, Cloud, 
  CloudRain, CloudLightning, Snowflake, Loader2,
  CloudFog, CloudSun, AlertTriangle, CalendarDays, ArrowRight, Umbrella
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface WeatherData {
  location: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  current: {
    temperature: string;
    condition: string;
    humidity: string;
    wind: string;
    precipitation: string;
    realFeel: string;
    realFeelShade: string;
    windGusts: string;
    airQuality: string;
  };
  forecast: {
    day: string;
    high: string;
    low: string;
    condition: string;
    hourly: {
      time: string;
      temperature: number;
      precipitation: number;
      wind: number;
      condition: string;
    }[];
  }[];
  alerts?: {
    messages: string[];
    type: string | null;
  };
  stormForecast?: {
    active: boolean;
    name?: string;
    category?: string;
    distance?: string;
    direction?: string;
    impact?: string;
  };
}

export default function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'temperature' | 'precipitation' | 'wind'>('temperature');
  const [radarOverlay, setRadarOverlay] = useState<'clouds' | 'temp'>('clouds');

  // Cache to store previously searched weather data
  const weatherCache = useRef<Record<string, WeatherData>>({});

  // Fetch weather for a specific query
  const fetchWeather = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const cacheKey = searchQuery.toLowerCase().trim();
    if (weatherCache.current[cacheKey]) {
      setWeather(weatherCache.current[cacheKey]);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json() as WeatherData;
      
      // Save to cache
      weatherCache.current[cacheKey] = data;
      setWeather(data);
      setSelectedDayIndex(0); // Reset selected day on new search
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Unable to fetch weather information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(query);
  };

  // Helper to get the right icon based on condition
  const getWeatherIcon = (condition: string, className = "w-6 h-6", isSelected = false) => {
    const cond = condition.toLowerCase();
    const strokeWidth = 2.5; // Thicker stroke to match the design
    
    // In the design, active items have white icons, inactive have blue icons.
    // For the main large icon, it's always blue/yellow.
    // We'll use a base color class that can be overridden by the parent if needed,
    // but default to the specific colors from the design.
    const iconColor = isSelected ? "text-white" : "text-[#3b82f6]"; // Using a vibrant blue similar to the image
    const finalClassName = `${className} ${iconColor}`;
    
    if (cond.includes('rain')) 
      return <CloudRain className={finalClassName} strokeWidth={strokeWidth} />;
    if (cond.includes('storm') || cond.includes('thunder')) 
      return <CloudLightning className={finalClassName} strokeWidth={strokeWidth} />;
    if (cond.includes('snow')) 
      return <Snowflake className={finalClassName} strokeWidth={strokeWidth} />;
    if (cond.includes('partly')) 
      return <CloudSun className={finalClassName} strokeWidth={strokeWidth} />;
    if (cond.includes('cloud')) 
      return <Cloud className={finalClassName} strokeWidth={strokeWidth} />;
    if (cond.includes('fog')) 
      return <CloudFog className={finalClassName} strokeWidth={strokeWidth} />;
    return <Sun className={finalClassName} strokeWidth={strokeWidth} />; // Default to Sun/Clear
  };

  // Helper to get background gradient based on condition
  const getBackgroundGradient = (condition?: string) => {
    if (!condition) return 'from-cyan-400 via-blue-500 to-indigo-600';
    const cond = condition.toLowerCase();
    if (cond.includes('rain')) return 'from-blue-600 via-indigo-700 to-slate-800';
    if (cond.includes('storm')) return 'from-fuchsia-900 via-purple-900 to-slate-900';
    if (cond.includes('snow')) return 'from-sky-300 via-cyan-400 to-blue-500';
    if (cond.includes('cloud')) return 'from-sky-400 via-blue-500 to-indigo-500';
    if (cond.includes('clear') || cond.includes('sun')) return 'from-amber-300 via-orange-400 to-rose-500';
    return 'from-cyan-400 via-blue-500 to-indigo-600';
  };

  // Helper to get alert image
  const getAlertImage = (type: string | null) => {
    switch (type) {
      case 'storm': return 'https://images.unsplash.com/photo-1492011221367-f47e3ccd77a0?auto=format&fit=crop&w=800&q=80';
      case 'flood': return 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80';
      case 'rain': return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80';
      case 'heat': return 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80';
      case 'snow': return 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=800&q=80';
      case 'general': return 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=800&q=80';
      default: return null;
    }
  };

  // Helper to render decorative background icons
  const renderDecorativeIcons = (condition?: string) => {
    if (!condition) return null;
    const cond = condition.toLowerCase();
    if (cond.includes('rain')) {
      return (
        <>
          <CloudRain className="absolute -top-12 -right-12 w-56 h-56 text-blue-500/5 animate-pulse" />
          <Droplets className="absolute bottom-10 -left-16 w-48 h-48 text-blue-400/5 animate-bounce" />
        </>
      );
    }
    if (cond.includes('storm') || cond.includes('thunder')) {
      return (
        <>
          <CloudLightning className="absolute -top-12 -right-12 w-56 h-56 text-slate-500/5 animate-pulse" />
          <Wind className="absolute bottom-10 -left-16 w-48 h-48 text-slate-400/5 animate-bounce" />
        </>
      );
    }
    if (cond.includes('snow')) {
      return (
        <>
          <Snowflake className="absolute -top-12 -right-12 w-56 h-56 text-blue-300/10 animate-[spin_10s_linear_infinite]" />
          <Snowflake className="absolute bottom-10 -left-16 w-48 h-48 text-blue-200/10 animate-[spin_15s_linear_infinite]" />
        </>
      );
    }
    if (cond.includes('cloud')) {
      return (
        <>
          <Cloud className="absolute -top-12 -right-12 w-56 h-56 text-slate-400/5 animate-[bounce_8s_infinite]" />
          <CloudFog className="absolute bottom-10 -left-16 w-48 h-48 text-slate-300/5 animate-[bounce_10s_infinite]" />
        </>
      );
    }
    // Default / Clear / Sun
    return (
      <>
        <Sun className="absolute -top-12 -right-12 w-56 h-56 text-yellow-500/5 animate-[spin_20s_linear_infinite]" />
        <Sun className="absolute bottom-10 -left-16 w-48 h-48 text-yellow-400/5 animate-[spin_15s_linear_infinite]" />
      </>
    );
  };

  const handleStart = () => {
    setHasStarted(true);
  };

  // Helper to render custom chart labels
  const CustomLabel = (props: any) => {
    const { x, y, value, index } = props;
    const hourlyData = weather?.forecast[selectedDayIndex]?.hourly[index];
    
    if (!hourlyData) return null;

    let displayValue = value;
    if (activeTab === 'temperature') displayValue = `${value}°`;
    if (activeTab === 'precipitation') displayValue = `${value}%`;
    if (activeTab === 'wind') displayValue = `${value} km/h`;

    return (
      <g>
        <text x={x} y={y - 15} fill="#64748b" fontSize={12} textAnchor="middle" fontWeight={600}>
          {displayValue}
        </text>
        {activeTab === 'temperature' && (
          <foreignObject x={x - 12} y={y + 10} width={24} height={24}>
            <div className="flex justify-center text-slate-400">
              {getWeatherIcon(hourlyData.condition, "w-5 h-5")}
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const vietnamProvinces = [
    "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP Hồ Chí Minh", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
  ];

  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredCities = vietnamProvinces.filter(city => 
    city.toLowerCase().includes(query.toLowerCase())
  );

  const suggestedCities = [
    "Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong", "Can Tho", "Da Lat", "Nha Trang"
  ];

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 relative overflow-hidden">
        {/* Decorative background elements */}
        <Sun className="absolute -top-20 -right-20 w-96 h-96 text-yellow-300/20 animate-[spin_20s_linear_infinite]" />
        <Cloud className="absolute bottom-10 -left-10 w-64 h-64 text-white/10 animate-[bounce_10s_infinite]" />
        <CloudRain className="absolute top-40 left-20 w-32 h-32 text-blue-200/20 animate-pulse" />
        
        <div className="relative z-10 text-center max-w-lg mx-auto bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl">
          <div className="flex justify-center mb-8 relative">
            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full"></div>
            <CloudSun className="w-32 h-32 text-white drop-shadow-2xl relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-md tracking-tight">
            Weather <span className="text-yellow-300">AI</span>
          </h1>
          <p className="text-lg text-white/90 mb-10 font-medium leading-relaxed">
            Discover real-time weather updates, 8-day forecasts, and severe weather alerts powered by OpenAI GPT-4o.
          </p>
          <button 
            onClick={() => setHasStarted(true)}
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95"
          >
            Get Started
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-700 bg-gradient-to-br ${getBackgroundGradient(weather?.current.condition)}`}>
      
      {/* App Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center gap-3 mb-2 bg-white px-6 py-3 rounded-full shadow-lg border border-slate-100">
          <Sun className="w-8 h-8 text-yellow-400 animate-[spin_10s_linear_infinite]" />
          <h1 className="text-3xl font-extrabold text-slate-800 drop-shadow-sm">
            Weather Forecast
          </h1>
          <CloudRain className="w-8 h-8 text-blue-500 animate-bounce" />
        </div>
      </div>

      <div className="w-full max-w-3xl">
        
        {/* Search Bar */}
        <div className="relative mb-6 max-w-lg mx-auto group z-50">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for a province/city in Vietnam..."
              className="w-full pl-14 pr-6 py-4 rounded-full bg-white/90 backdrop-blur-xl shadow-lg border border-white/60 focus:outline-none focus:ring-4 focus:ring-blue-400/30 text-slate-700 placeholder-slate-400 font-medium transition-all duration-300 group-hover:shadow-xl group-hover:bg-white text-lg"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 transition-colors group-focus-within:text-blue-500" />
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && query && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden max-h-64 overflow-y-auto z-50">
              {filteredCities.map((city, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setQuery(city);
                    setShowSuggestions(false);
                    fetchWeather(city);
                  }}
                  className="w-full text-left px-6 py-3 hover:bg-blue-50 text-slate-700 font-medium transition-colors border-b border-slate-100 last:border-0"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Cities */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {suggestedCities.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setQuery(city);
                fetchWeather(city);
              }}
              className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-800 transition-all shadow-md hover:shadow-lg"
            >
              {city}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/80 text-red-600 text-sm font-medium border border-red-100 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Alerts Section */}
        {weather?.alerts && weather.alerts.messages && weather.alerts.messages.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-red-100 shadow-md">
            {weather.alerts.type && getAlertImage(weather.alerts.type) && (
              <div className="h-32 w-full relative">
                <img 
                  src={getAlertImage(weather.alerts.type)!} 
                  alt="Weather Alert" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 to-transparent"></div>
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white font-bold">
                  <AlertTriangle className="w-5 h-5 animate-pulse text-red-400" />
                  <span>Severe Weather Alert</span>
                </div>
              </div>
            )}
            <div className={`p-4 ${!weather.alerts.type || !getAlertImage(weather.alerts.type) ? 'pt-4' : 'pt-3'}`}>
              {(!weather.alerts.type || !getAlertImage(weather.alerts.type)) && (
                <div className="flex items-center gap-2 text-red-600 mb-2 font-bold">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <span>Severe Weather Alert</span>
                </div>
              )}
              <ul className="list-disc list-inside text-sm text-slate-800 space-y-1 font-medium">
                {weather.alerts.messages.map((alert, idx) => (
                  <li key={idx}>{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Storm Forecast Section */}
        {weather?.stormForecast?.active && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-xl relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
            <div className="p-5 relative z-10">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <CloudLightning className="w-6 h-6 animate-pulse" />
                  <span className="text-lg uppercase tracking-wide">Active Storm Tracker</span>
                </div>
                {weather.stormForecast.category && (
                  <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-full border border-rose-500/30">
                    {weather.stormForecast.category}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {weather.stormForecast.name && (
                  <div className="col-span-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Storm Name</p>
                    <p className="text-white font-bold text-xl">{weather.stormForecast.name}</p>
                  </div>
                )}
                
                {weather.stormForecast.distance && (
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Distance</p>
                    <p className="text-white font-medium">{weather.stormForecast.distance}</p>
                  </div>
                )}
                
                {weather.stormForecast.direction && (
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Movement</p>
                    <p className="text-white font-medium">{weather.stormForecast.direction}</p>
                  </div>
                )}
                
                {weather.stormForecast.impact && (
                  <div className="col-span-2 bg-rose-900/30 p-3 rounded-xl border border-rose-500/20 mt-2">
                    <p className="text-xs text-rose-300 uppercase font-semibold mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Expected Impact
                    </p>
                    <p className="text-rose-100 font-medium text-sm leading-relaxed">{weather.stormForecast.impact}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Weather Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 relative overflow-hidden w-full max-w-3xl mx-auto min-h-[600px] flex flex-col transition-all duration-500">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-600 font-medium animate-pulse">Fetching weather data...</p>
              </div>
            </div>
          )}

          {weather ? (
            <div className="relative z-10 flex flex-col h-full flex-grow animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Top Section: Current Weather */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                {/* Left Side */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-6">
                    <div className="text-blue-500 drop-shadow-xl transform transition-transform hover:scale-105 duration-300">
                      {getWeatherIcon(weather.current.condition, "w-32 h-32")}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-start">
                        <span className="text-[120px] font-light text-slate-800 tracking-tighter leading-none">
                          {weather.current.temperature.replace('°C', '')}
                        </span>
                        <span className="text-4xl text-slate-500 font-medium mt-4 ml-1">°C</span>
                      </div>
                      <p className="text-xl text-slate-500 font-medium mt-1 ml-2">
                        RealFeel® <span className="text-slate-700 font-semibold">{weather.current.realFeel}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 ml-2">
                    <p className="text-3xl font-bold text-slate-800 capitalize tracking-tight">{weather.current.condition}</p>
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mt-2 cursor-pointer flex items-center gap-1 hover:text-blue-700 transition-colors group">
                      More Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>

                {/* Right Side - Details Grid */}
                <div className="w-full md:w-1/2 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-slate-200/80 pt-6 md:pt-0 md:pl-10">
                  <div className="flex justify-between items-center border-b border-slate-100/80 pb-3">
                    <span className="text-slate-500 text-lg">RealFeel Shade™</span>
                    <span className="font-bold text-slate-800 text-lg">{weather.current.realFeelShade}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100/80 pb-3">
                    <span className="text-slate-500 text-lg">Wind</span>
                    <span className="font-bold text-slate-800 text-lg">{weather.current.wind}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100/80 pb-3">
                    <span className="text-slate-500 text-lg">Wind Gusts</span>
                    <span className="font-bold text-slate-800 text-lg">{weather.current.windGusts}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-slate-500 text-lg">Air Quality</span>
                    <span className={`font-bold text-lg px-3 py-1 rounded-full ${weather.current.airQuality.toLowerCase().includes('unhealthy') || weather.current.airQuality.toLowerCase().includes('poor') ? 'bg-rose-100 text-rose-600' : weather.current.airQuality.toLowerCase().includes('moderate') ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-600'}`}>
                      {weather.current.airQuality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Tabs & Chart */}
              <div className="mb-10 flex-grow">
                <div className="flex gap-4 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
                  <button 
                    onClick={() => setActiveTab('temperature')}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'temperature' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    Temperature
                  </button>
                  <button 
                    onClick={() => setActiveTab('precipitation')}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'precipitation' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    Precipitation
                  </button>
                  <button 
                    onClick={() => setActiveTab('wind')}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'wind' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                  >
                    Wind
                  </button>
                </div>

                {weather.forecast[selectedDayIndex]?.hourly && (
                  <div className="h-64 w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weather.forecast[selectedDayIndex].hourly} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fef08a" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#fef08a" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5eead4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#5eead4" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }} 
                          dy={10}
                        />
                        <Area 
                          type="monotone" 
                          dataKey={activeTab} 
                          stroke={activeTab === 'temperature' ? '#eab308' : activeTab === 'precipitation' ? '#3b82f6' : '#14b8a6'} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill={`url(#color${activeTab === 'temperature' ? 'Temp' : activeTab === 'precipitation' ? 'Precip' : 'Wind'})`} 
                          label={<CustomLabel />}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Bottom Section: Daily Forecast */}
              <div className="flex overflow-x-auto pb-4 gap-3 snap-x hide-scrollbar border-t border-slate-100/50 pt-6">
                {weather.forecast.map((day, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedDayIndex(index)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[5rem] snap-center transition-all duration-300 ${
                      selectedDayIndex === index 
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 transform scale-105' 
                        : 'bg-white/50 hover:bg-white text-slate-600 hover:shadow-md hover:-translate-y-1'
                    }`}
                  >
                    <span className={`text-sm font-bold mb-3 ${selectedDayIndex === index ? 'text-white' : 'text-slate-500'}`}>
                      {index === 0 ? 'Today' : day.day.substring(0, 3)}
                    </span>
                    <div className={`mb-3 drop-shadow-sm transition-transform duration-300 ${selectedDayIndex === index ? 'scale-110' : ''}`}>
                      {getWeatherIcon(day.condition, "w-8 h-8", selectedDayIndex === index)}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <span className={selectedDayIndex === index ? 'text-white' : 'text-slate-800'}>{day.high.replace('°C', '°')}</span>
                      <span className={selectedDayIndex === index ? 'text-slate-400' : 'text-slate-400 text-xs'}>{day.low.replace('°C', '°')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : !loading && !error ? (
            <div className="text-center py-12 text-slate-500 relative z-10">
              <CloudSun className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">Please enter a city name to get information about that city</p>
            </div>
          ) : null}
        </div>

        {/* Radar Map Card */}
        {weather?.coordinates && (
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 relative overflow-hidden w-full max-w-3xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {weather.location.split(',')[0]} Radar
              </h3>
            </div>
            <div className="w-full h-[450px] rounded-3xl overflow-hidden border border-slate-200/80 relative shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=5&overlay=${radarOverlay}&product=ecmwf&level=surface&lat=${weather.coordinates.lat}&lon=${weather.coordinates.lon}`}
                frameBorder="0"
                title="Weather Radar"
                className="opacity-90 hover:opacity-100 transition-opacity duration-500"
              ></iframe>
            </div>
            <div className="flex gap-4 mt-6 justify-center">
              <button 
                onClick={() => setRadarOverlay('clouds')}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${radarOverlay === 'clouds' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                <div className={`w-6 h-6 rounded-full overflow-hidden ${radarOverlay === 'clouds' ? 'ring-2 ring-white/50' : ''}`}>
                  <img src="https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&w=100&q=80" alt="Clouds" className="w-full h-full object-cover" />
                </div>
                Clouds
              </button>
              <button 
                onClick={() => setRadarOverlay('temp')}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${radarOverlay === 'temp' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 ${radarOverlay === 'temp' ? 'ring-2 ring-white/50' : ''}`}></div>
                Temperature
              </button>
            </div>
          </div>
        )}
        
        <p className="text-center text-xs text-white/80 mt-6 font-medium drop-shadow-sm">
          Data provided by OpenAI GPT-4o
        </p>
      </div>
    </div>
  );
}
