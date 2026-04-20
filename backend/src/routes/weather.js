const express = require("express");
const router = express.Router();
const { getWeatherByCity } = require("../utils/weatherService");

router.get("/:city", async (req, res) => {
  const { city } = req.params;
  const weather = await getWeatherByCity(city);
  if (weather) {
    res.json({ success: true, data: weather });
  } else {
    res
      .status(503)
      .json({ success: false, error: "Weather service unavailable" });
  }
});

module.exports = router;
