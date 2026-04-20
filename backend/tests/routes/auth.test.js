const request = require("supertest");
const { app, getAuthTokens } = require("../helpers/app");
const User = require("../../src/models/User");
const RefreshToken = require("../../src/models/RefreshToken");

describe("Auth Routes", () => {
  beforeEach(async () => {
    await RefreshToken.deleteMany({});
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        firstName: "Test",
        lastName: "User",
        email: "testreg@example.com",
        password: "password123",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.data.email).toBe("testreg@example.com");
    });

    it("should return 400 if email exists", async () => {
      await request(app).post("/api/auth/register").send({
        firstName: "A",
        lastName: "B",
        email: "duplicate@test.com",
        password: "password123",
      });
      const res = await request(app).post("/api/auth/register").send({
        firstName: "C",
        lastName: "D",
        email: "duplicate@test.com",
        password: "password123",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/существует/);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await getAuthTokens({
        email: "login@test.com",
        password: "mypass123",
        firstName: "Login",
        lastName: "Test",
        role: "user",
      });
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "mypass123" });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it("should return 400 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "wrong" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Неверный/);
    });
  });

  describe("POST /api/auth/refresh", () => {
    let refreshToken;
    beforeEach(async () => {
      const reg = await request(app).post("/api/auth/register").send({
        firstName: "Refresh",
        lastName: "Me",
        email: "refresh@test.com",
        password: "password123",
      });
      refreshToken = reg.body.refreshToken;
    });

    it("should refresh access token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("should return 400 if no refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user data with valid token", async () => {
      const { accessToken } = await getAuthTokens({
        email: "me@test.com",
        password: "password123",
        firstName: "Me",
        lastName: "User",
      });
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("me@test.com");
    });
  });

  describe("PUT /api/auth/update-profile", () => {
    it("should update user profile", async () => {
      const { accessToken } = await getAuthTokens({
        email: "update@test.com",
        password: "pass123",
        firstName: "Old",
        lastName: "Name",
        role: "user",
      });
      const res = await request(app)
        .put("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          firstName: "New",
          lastName: "Name",
          phone: "+79161234567",
          skills: ["hiking", "swimming"],
          aboutMe: "I love travel",
        });
      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe("New");
      expect(res.body.data.skills).toContain("hiking");
    });

    it("should return 400 on validation error", async () => {
      const { accessToken } = await getAuthTokens({
        email: "updateerr@test.com",
        password: "pass123",
        firstName: "Err",
        lastName: "User",
        role: "user",
      });
      const res = await request(app)
        .put("/api/auth/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ phone: "invalid" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/permissions", () => {
    it("should return permissions for user role", async () => {
      const { accessToken } = await getAuthTokens({
        email: "perms@test.com",
        password: "pass123",
        firstName: "Perm",
        lastName: "User",
        role: "user",
      });
      const res = await request(app)
        .get("/api/auth/permissions")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.permissions)).toBe(true);
      expect(res.body.permissions).toContain("trip:create");
      expect(res.body.permissions).toContain("application:create");
    });
  });

  describe("POST /api/auth/avatar", () => {
    it("should upload avatar", async () => {
      const { accessToken } = await getAuthTokens({
        email: "avatar@test.com",
        password: "pass123",
        firstName: "Avatar",
        lastName: "User",
        role: "user",
      });
      const res = await request(app)
        .post("/api/auth/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("avatar", Buffer.from("fakeimage"), "test.jpg");
      expect(res.status).toBe(200);
      expect(res.body.avatarUrl).toBeDefined();
    });

    it("should return 400 if no file", async () => {
      const { accessToken } = await getAuthTokens({
        email: "noavatar@test.com",
        password: "pass123",
        firstName: "No",
        lastName: "Avatar",
        role: "user",
      });
      const res = await request(app)
        .post("/api/auth/avatar")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/avatar", () => {
    it("should return avatar url if exists", async () => {
      const { accessToken } = await getAuthTokens({
        email: "getavatar@test.com",
        password: "pass123",
        firstName: "Get",
        lastName: "Avatar",
        role: "user",
      });
      await request(app)
        .post("/api/auth/avatar")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("avatar", Buffer.from("fake"), "test.jpg");
      const res = await request(app)
        .get("/api/auth/avatar")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.avatarUrl).toBeDefined();
    });

    it("should return null if no avatar", async () => {
      const { accessToken } = await getAuthTokens({
        email: "noavatar2@test.com",
        password: "pass123",
        firstName: "No2",
        lastName: "Avatar",
        role: "user",
      });
      const res = await request(app)
        .get("/api/auth/avatar")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.avatarUrl).toBeNull();
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout and delete refresh token", async () => {
      const { refreshToken } = await getAuthTokens({
        email: "logout@test.com",
        password: "pass123",
        firstName: "Logout",
        lastName: "User",
        role: "user",
      });
      const res = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Выход выполнен успешно/);
    });

    it("should return 400 if no refresh token", async () => {
      const res = await request(app).post("/api/auth/logout").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/refresh - errors", () => {
    it("should return 401 if refresh token expired", async () => {
      const { refreshToken } = await getAuthTokens({
        email: "expired@test.com",
        password: "pass123",
        firstName: "Expired",
        lastName: "Token",
        role: "user",
      });
      await RefreshToken.deleteMany({ token: refreshToken });
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/avatar - errors", () => {
    it("should return 500 on S3 error", async () => {
      const { accessToken } = await getAuthTokens({
        email: "s3error@test.com",
        password: "pass123",
        firstName: "S3",
        lastName: "Error",
        role: "user",
      });
    });
  });
});
