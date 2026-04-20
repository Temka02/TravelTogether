const mongoose = require("mongoose");
const connectDB = require("../../config/database");

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

describe("Database Config", () => {
  let exitMock;

  beforeEach(() => {
    exitMock = jest.spyOn(process, "exit").mockImplementation(() => {});
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    exitMock.mockRestore();
    jest.clearAllMocks();
  });

  it("should connect to MongoDB successfully", async () => {
    mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("MongoDB Connected"),
    );
    expect(exitMock).not.toHaveBeenCalled();
  });

  it("should exit process on connection error", async () => {
    const error = new Error("Connection failed");
    mongoose.connect.mockRejectedValue(error);
    await connectDB();
    expect(console.error).toHaveBeenCalledWith(
      "Database connection error:",
      error,
    );
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
