const authRefresh = require("../../src/middleware/authRefresh");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../../src/models/RefreshToken");

jest.mock("jsonwebtoken");
jest.mock("../../src/models/RefreshToken");

describe("authRefresh middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 400 if refresh token missing", async () => {
    req.body = {};
    await authRefresh(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Refresh token отсутствует" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token invalid", async () => {
    req.body = { refreshToken: "invalid" };
    const error = new Error("invalid");
    error.name = "JsonWebTokenError";
    jwt.verify.mockImplementation(() => {
      throw error;
    });
    await authRefresh(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Неверный refresh token" }),
    );
  });

  it("should return 401 if token expired", async () => {
    req.body = { refreshToken: "expired" };
    const error = new Error("expired");
    error.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => {
      throw error;
    });
    await authRefresh(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Refresh token истек" }),
    );
  });

  it("should return 401 if token not found in DB", async () => {
    req.body = { refreshToken: "validbutnotstored" };
    jwt.verify.mockReturnValue({ userId: "123" });
    RefreshToken.findOne.mockResolvedValue(null);
    await authRefresh(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Refresh token не найден или отозван" }),
    );
  });

  it("should return 401 if token expired in DB", async () => {
    req.body = { refreshToken: "storedbutexpired" };
    jwt.verify.mockReturnValue({ userId: "123" });
    RefreshToken.findOne.mockResolvedValue({
      expiresAt: new Date(Date.now() - 1000),
      deleteOne: jest.fn(),
    });
    await authRefresh(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Refresh token истек" }),
    );
  });

  it("should call next and attach userId and refreshToken", async () => {
    req.body = { refreshToken: "good" };
    jwt.verify.mockReturnValue({ userId: "123" });
    RefreshToken.findOne.mockResolvedValue({
      expiresAt: new Date(Date.now() + 86400000),
    });
    await authRefresh(req, res, next);
    expect(req.userId).toBe("123");
    expect(req.refreshToken).toBe("good");
    expect(next).toHaveBeenCalled();
  });
});
