const authAccess = require("../../src/middleware/authAccess");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/User");

jest.mock("jsonwebtoken");
jest.mock("../../src/models/User");

describe("authAccess middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should return 401 if no authorization header", async () => {
    req.header.mockReturnValue(null);
    await authAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Access token отсутствует" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token format invalid", async () => {
    req.header.mockReturnValue("InvalidToken");
    await authAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Access token отсутствует" }),
    );
  });

  it("should return 401 if token expired", async () => {
    req.header.mockReturnValue("Bearer expiredtoken");
    const tokenExpiredError = new Error("jwt expired");
    tokenExpiredError.name = "TokenExpiredError";
    jwt.verify.mockImplementation(() => {
      throw tokenExpiredError;
    });
    await authAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Access token истек" }),
    );
  });

  it("should return 401 if token invalid", async () => {
    req.header.mockReturnValue("Bearer invalid");
    const invalidTokenError = new Error("invalid token");
    invalidTokenError.name = "JsonWebTokenError";
    jwt.verify.mockImplementation(() => {
      throw invalidTokenError;
    });
    await authAccess(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Неверный access token" }),
    );
  });

  it("should attach user to req and call next", async () => {
    const mockUser = { _id: "123", role: "user" };
    req.header.mockReturnValue("Bearer validtoken");
    jwt.verify.mockReturnValue({ userId: "123" });

    const mockSelect = jest.fn().mockResolvedValue(mockUser);
    const mockFindById = jest.fn().mockReturnValue({ select: mockSelect });
    User.findById.mockImplementation(mockFindById);

    await authAccess(req, res, next);

    expect(mockFindById).toHaveBeenCalledWith("123");
    expect(mockSelect).toHaveBeenCalledWith("-password");
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
