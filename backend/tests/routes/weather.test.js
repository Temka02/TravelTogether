const request = require("supertest");
const { app } = require("../helpers/app");
const axios = require("axios");

jest.mock("axios");

describe("Weather Route", () => {
  it("should return weather data for city", async () => {
    axios.get.mockResolvedValue({
      data: {
        main: { temp: 22.5 },
        weather: [{ description: "ясно", icon: "01d" }],
        name: "Moscow",
      },
    });
    const res = await request(app).get("/api/weather/Moscow");
    expect(res.status).toBe(200);
    expect(res.body.data.temp).toBe(22.5);
  });

  it("should return 503 if API fails", async () => {
    axios.get.mockRejectedValue(new Error("API down"));
    const res = await request(app).get("/api/weather/Nowhere");
    expect(res.status).toBe(503);
  });
});
