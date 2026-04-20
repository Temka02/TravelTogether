const request = require("supertest");
const { app, getAuthTokens } = require("../helpers/app");
const Trip = require("../../src/models/Trip");
const Application = require("../../src/models/Application");

describe("Applications Routes", () => {
  let userToken, user, organizerToken, organizer, trip;

  beforeEach(async () => {
    const userData = await getAuthTokens({
      email: "appuser2@test.com",
      password: "password123",
      firstName: "App",
      lastName: "User",
      role: "user",
    });
    userToken = userData.accessToken;
    user = userData.user;

    const orgData = await getAuthTokens({
      email: "org2@test.com",
      password: "password123",
      firstName: "Org",
      lastName: "User",
      role: "organizer",
    });
    organizerToken = orgData.accessToken;
    organizer = orgData.user;

    trip = new Trip({
      title: "Joinable Trip",
      destination: "Paris",
      description: "Trip",
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 86400000 * 5),
      price: 200,
      maxParticipants: 5,
      createdBy: organizer._id,
    });
    await trip.save();
  });

  describe("POST /api/applications", () => {
    it("should create application", async () => {
      const res = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ tripId: trip._id, message: "Take me!" });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending");
    });

    it("should return 400 if already applied", async () => {
      await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ tripId: trip._id });
      const res = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ tripId: trip._id });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/applications/:id/accept", () => {
    let application;
    beforeEach(async () => {
      application = new Application({
        userId: user._id,
        tripId: trip._id,
        status: "pending",
      });
      await application.save();
    });

    it("should accept application as organizer", async () => {
      const res = await request(app)
        .put(`/api/applications/${application._id}/accept`)
        .set("Authorization", `Bearer ${organizerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("accepted");
      const updatedTrip = await Trip.findById(trip._id);
      expect(updatedTrip.participants).toContainEqual(user._id);
    });
  });

  describe("DELETE /api/applications/:id", () => {
    let application, userToken, organizerToken;

    beforeEach(async () => {
      const userData = await getAuthTokens({
        email: "deluser@test.com",
        password: "pass123",
        firstName: "Del",
        lastName: "User",
        role: "user",
      });
      userToken = userData.accessToken;
      const orgData = await getAuthTokens({
        email: "delorg@test.com",
        password: "pass123",
        firstName: "Del",
        lastName: "Org",
        role: "organizer",
      });
      organizerToken = orgData.accessToken;
      const trip = new Trip({
        title: "Delete App Trip",
        destination: "Test",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
      });
      await trip.save();
      application = new Application({
        userId: userData.user._id,
        tripId: trip._id,
        status: "pending",
      });
      await application.save();
    });

    it("should allow user to delete own pending application", async () => {
      const res = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      const deleted = await Application.findById(application._id);
      expect(deleted).toBeNull();
    });

    it("should allow organizer to delete application on his trip", async () => {
      const res = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${organizerToken}`);
      expect(res.status).toBe(200);
    });

    it("should return 400 if application already processed", async () => {
      application.status = "accepted";
      await application.save();
      const res = await request(app)
        .delete(`/api/applications/${application._id}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent application", async () => {
      const res = await request(app)
        .delete("/api/applications/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/applications/check/:tripId", () => {
    it("should return application if exists", async () => {
      const { accessToken, user } = await getAuthTokens({
        email: "checkuser@test.com",
        password: "pass123",
        firstName: "Check",
        lastName: "User",
        role: "user",
      });
      const orgData = await getAuthTokens({
        email: "checkorg@test.com",
        password: "pass123",
        firstName: "Check",
        lastName: "Org",
        role: "organizer",
      });
      const trip = new Trip({
        title: "Check Trip",
        destination: "Test",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
      });
      await trip.save();
      const application = new Application({
        userId: user._id,
        tripId: trip._id,
      });
      await application.save();
      const response = await request(app) // ← переименовано
        .get(`/api/applications/check/${trip._id}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
      expect(response.body.application.status).toBe("pending");
    });

    it("should return null if no application", async () => {
      const { accessToken } = await getAuthTokens({
        email: "nocheck@test.com",
        password: "pass123",
        firstName: "No",
        lastName: "Check",
        role: "user",
      });
      const res = await request(app)
        .get("/api/applications/check/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.application).toBeNull();
    });
  });

  describe("GET /api/applications/my - errors", () => {
    it("should handle unauthorized request", async () => {
      const res = await request(app).get("/api/applications/my");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/applications - errors", () => {
    it("should return 404 if trip not found", async () => {
      const { accessToken } = await getAuthTokens({
        email: "notfound@test.com",
        password: "pass123",
        firstName: "NotFound",
        lastName: "User",
        role: "user",
      });
      const res = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ tripId: "507f1f77bcf86cd799439011" });
      expect(res.status).toBe(404);
    });

    it("should return 400 if user is organizer", async () => {
      const { accessToken, user } = await getAuthTokens({
        email: "orgapply@test.com",
        password: "pass123",
        firstName: "Org",
        lastName: "Apply",
        role: "organizer",
      });
      const trip = new Trip({
        title: "Own Trip",
        destination: "Own",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 5,
        createdBy: user._id,
      });
      await trip.save();
      const res = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ tripId: trip._id });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Организатор не может подавать заявку/);
    });
  });
});
