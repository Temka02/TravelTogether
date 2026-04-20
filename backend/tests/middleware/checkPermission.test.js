const checkPermission = require("../../src/middleware/checkPermission");

describe("checkPermission middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should allow guest for trip:read", () => {
    req.user = null;
    const middleware = checkPermission("trip:read");
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should allow user for trip:create", () => {
    req.user = { role: "user" };
    const middleware = checkPermission("trip:create");
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should deny guest for trip:create", () => {
    req.user = null;
    const middleware = checkPermission("trip:create");
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    // Ожидаем полный текст ошибки
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Недостаточно прав для выполнения этой операции",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 for unknown permission", () => {
    req.user = { role: "admin" };
    const middleware = checkPermission("unknown:perm");
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Неопределённое разрешение" }),
    );
  });
});
