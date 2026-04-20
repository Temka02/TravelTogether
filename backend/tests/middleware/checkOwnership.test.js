const checkOwnership = require("../../src/middleware/checkOwnership");
const Trip = require("../../src/models/Trip");

jest.mock("../../src/models/Trip");

describe("checkOwnership middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null, params: { id: "trip123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should allow admin without checking ownership", async () => {
    req.user = { role: "admin", _id: "adminId" };
    const middleware = checkOwnership(Trip, "id");
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(Trip.findById).not.toHaveBeenCalled();
  });

  it("should return 401 if no user", async () => {
    req.user = null;
    const middleware = checkOwnership(Trip, "id");
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Требуется авторизация" }),
    );
  });

  it("should return 404 if resource not found", async () => {
    req.user = { role: "user", _id: "userId" };
    Trip.findById.mockResolvedValue(null);
    const middleware = checkOwnership(Trip, "id");
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Ресурс не найден" }),
    );
  });

  it("should return 403 if not owner", async () => {
    req.user = { role: "user", _id: "userId" };
    const mockTrip = { createdBy: "otherUserId" };
    Trip.findById.mockResolvedValue(mockTrip);
    const middleware = checkOwnership(Trip, "id");
    await middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Доступ только для владельца ресурса" }),
    );
  });

  it("should attach resource and call next for owner", async () => {
    req.user = { role: "user", _id: "ownerId" };
    const mockTrip = { createdBy: "ownerId" };
    Trip.findById.mockResolvedValue(mockTrip);
    const middleware = checkOwnership(Trip, "id");
    await middleware(req, res, next);
    expect(req.resource).toEqual(mockTrip);
    expect(next).toHaveBeenCalled();
  });
});
