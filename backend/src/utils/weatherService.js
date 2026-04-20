const axios = require("axios");

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

async function getWeatherByCity(city) {
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        q: city,
        appid: process.env.WEATHER_API_KEY,
        units: "metric",
        lang: "ru",
      },
      timeout: 5000,
    });
    return {
      temp: response.data.main.temp,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      city: response.data.name,
    };
  } catch (error) {
    console.error("Weather API error:", error.message);
    return null;
  }
}

module.exports = { getWeatherByCity };
