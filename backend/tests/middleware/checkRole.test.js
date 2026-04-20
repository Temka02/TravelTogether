const checkRole = require("../../src/middleware/checkRole");

describe("checkRole middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return 401 if no user", () => {
    const middleware = checkRole(["user"]);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Требуется авторизация" }),
    );
  });

  it("should allow user with correct role", () => {
    req.user = { role: "user" };
    const middleware = checkRole(["user", "admin"]);
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should return 403 if role not allowed", () => {
    req.user = { role: "guest" };
    const middleware = checkRole(["user"]);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Недостаточно прав для выполнения этой операции",
      }),
    );
  });
});
