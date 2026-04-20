const express = require("express");
const Trip = require("../models/Trip");
const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  const baseUrl = process.env.SITE_URL || "http://localhost:3001";
  const trips = await Trip.find({
    status: { $in: ["planning", "active"] },
  }).select("_id updatedAt");

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  xml += `  <url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

  trips.forEach((trip) => {
    xml += `  <url><loc>${baseUrl}/trips/${trip._id}</loc><lastmod>${trip.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  });

  xml += "</urlset>";
  res.header("Content-Type", "application/xml").send(xml);
});

module.exports = router;
