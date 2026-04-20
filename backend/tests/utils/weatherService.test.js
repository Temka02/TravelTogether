const { getWeatherByCity } = require("../../src/utils/weatherService");
const axios = require("axios");

jest.mock("axios");

describe("Weather Service", () => {
  it("should return formatted weather", async () => {
    axios.get.mockResolvedValue({
      data: {
        main: { temp: 15.3 },
        weather: [{ description: "облачно", icon: "04d" }],
        name: "Berlin",
      },
    });
    const result = await getWeatherByCity("Berlin");
    expect(result).toEqual({
      temp: 15.3,
      description: "облачно",
      icon: "04d",
      city: "Berlin",
    });
  });

  it("should return null on error", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));
    const result = await getWeatherByCity("Invalid");
    expect(result).toBeNull();
  });
});
