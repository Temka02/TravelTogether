const express = require("express");
const router = express.Router();

router.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.SITE_URL || "http://localhost:3001";

  const robotsTxt = `User-agent: *
Disallow: /api/
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /my-trips
Disallow: /applications
Disallow: /trips/create-trip
Disallow: /trips/edit-trip
Allow: /$
Allow: /trips/$
Sitemap: ${baseUrl}/sitemap.xml`;

  res.type("text/plain");
  res.send(robotsTxt);
});

module.exports = router;
