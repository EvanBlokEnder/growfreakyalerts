const https = require("https");

function processWeatherData(data) {
  if (!data || !data.weather) return;

  const weatherInfo = data.weather.map(item => ({
    weather_id: item.weather_id,
    active: item.active,
    duration: item.duration,
    start_duration_unix: item.start_duration_unix,
    end_duration_unix: item.end_duration_unix,
    weather_name: item.weather_name
  }));

  return { weather: weatherInfo };
}

function fetchWeather(callback) {
  const options = {
    method: "GET",
    hostname: "growagardenapi.vercel.app",
    path: "/api/GetWeather",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
      referer: "https://growagardenapi.vercel.app/api/GetWeather",
      "Content-Length": "0"
    }
  };

  const req = https.request(options, (res) => {
    const chunks = [];

    res.on("data", (chunk) => chunks.push(chunk));

    res.on("end", () => {
      const body = Buffer.concat(chunks).toString();
      try {
        const weatherData = JSON.parse(body);
        const processedData = processWeatherData(weatherData);
        callback(null, { success: true, ...processedData });
      } catch (e) {
        callback({ status: 500, message: "Failed to parse weather data" });
      }
    });
  });

  req.on("error", (err) => {
    callback({ status: 500, message: err.message });
  });

  req.end();
}

function register(app) {
  app.get("/api/GetWeather", (req, res) => {
    fetchWeather((error, result) => {
      if (error) {
        res.status(error.status || 500).json({ success: false, error: error.message });
      } else {
        res.json(result);
      }
    });
  });
}

module.exports = { register };
