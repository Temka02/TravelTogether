const request = require("supertest");
const { app } = require("../helpers/app");

describe("SEO Routes", () => {
  it("should return robots.txt", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.text).toContain("User-agent: *");
    expect(res.text).toContain("Sitemap:");
  });

  it("should return sitemap.xml", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<urlset");
  });
});
