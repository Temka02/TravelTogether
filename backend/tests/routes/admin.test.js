const request = require("supertest");
const { app, getAuthTokens } = require("../helpers/app");

describe("Admin Routes", () => {
  let adminToken, userToken;

  beforeEach(async () => {
    const adminData = await getAuthTokens({
      email: "admin@test.com",
      password: "adminpass",
      firstName: "Admin",
      lastName: "Super",
      role: "admin",
    });
    adminToken = adminData.accessToken;

    const userData = await getAuthTokens({
      email: "normal@test.com",
      password: "password123",
      firstName: "Normal",
      lastName: "User",
      role: "user",
    });
    userToken = userData.accessToken;
  });

  it("should allow admin to get users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
  });

  it("should forbid user to get users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("should allow admin to change user role", async () => {
    const user = await getAuthTokens({
      email: "rolechange@test.com",
      password: "pass",
      firstName: "Role",
      lastName: "Change",
    });
    const res = await request(app)
      .put(`/api/admin/users/${user.user._id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "organizer" });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("organizer");
  });
});
