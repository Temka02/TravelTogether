const request = require("supertest");
const { app, getAuthTokens } = require("../helpers/app");
const Trip = require("../../src/models/Trip");
const User = require("../../src/models/User");

describe("Trips Routes", () => {
  let userToken, user, creatorToken, creator;

  beforeEach(async () => {
    const userData = await getAuthTokens({
      email: "tripuser@test.com",
      password: "password123",
      firstName: "Trip",
      lastName: "User",
      role: "user",
    });
    userToken = userData.accessToken;
    user = userData.user;

    const creatorData = await getAuthTokens({
      email: "creator@test.com",
      password: "password123",
      firstName: "Creator",
      lastName: "Trip",
      role: "organizer",
    });
    creatorToken = creatorData.accessToken;
    creator = creatorData.user;
  });

  describe("GET /api/trips", () => {
    it("should return trips list", async () => {
      const res = await request(app).get("/api/trips");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/trips", () => {
    it("should create trip for authenticated user", async () => {
      const res = await request(app)
        .post("/api/trips")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "My Trip",
          destination: "Mountains",
          description: "Great adventure",
          startDate: "2025-08-01",
          endDate: "2025-08-10",
          price: 300,
          maxParticipants: 8,
          difficulty: "hard",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("My Trip");
      expect(res.body.data.createdBy._id.toString()).toBe(user._id.toString());
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/trips")
        .send({ title: "No Auth" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/trips/:id", () => {
    let tripId;
    beforeEach(async () => {
      const trip = new Trip({
        title: "Specific Trip",
        destination: "Beach",
        description: "Sun",
        startDate: new Date(),
        endDate: new Date(),
        price: 100,
        maxParticipants: 4,
        createdBy: creator._id,
      });
      await trip.save();
      tripId = trip._id;
    });

    it("should return trip by id", async () => {
      const res = await request(app).get(`/api/trips/${tripId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Specific Trip");
    });

    it("should return 404 for invalid id", async () => {
      const res = await request(app).get("/api/trips/507f1f77bcf86cd799439011");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/trips/:id", () => {
    let tripId;
    beforeEach(async () => {
      const trip = new Trip({
        title: "To Update",
        destination: "City",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 50,
        maxParticipants: 2,
        createdBy: creator._id,
      });
      await trip.save();
      tripId = trip._id;
    });

    it("should update trip as owner", async () => {
      const res = await request(app)
        .put(`/api/trips/${tripId}`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({ title: "Updated Title" });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
    });

    it("should return 403 for non-owner", async () => {
      const res = await request(app)
        .put(`/api/trips/${tripId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Hack" });
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/trips/:id", () => {
    let tripId;
    beforeEach(async () => {
      const trip = new Trip({
        title: "To Delete",
        destination: "Delete",
        description: "Del",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 1,
        createdBy: creator._id,
      });
      await trip.save();
      tripId = trip._id;
    });

    it("should delete trip as owner", async () => {
      const res = await request(app)
        .delete(`/api/trips/${tripId}`)
        .set("Authorization", `Bearer ${creatorToken}`);
      expect(res.status).toBe(200);
      const found = await Trip.findById(tripId);
      expect(found).toBeNull();
    });
  });

  describe("GET /api/trips/:id/participants", () => {
    it("should return participants list", async () => {
      const { accessToken, user } = await getAuthTokens({
        email: "part@test.com",
        password: "pass123",
        firstName: "Part",
        lastName: "User",
        role: "user",
      });
      const orgData = await getAuthTokens({
        email: "partorg@test.com",
        password: "pass123",
        firstName: "PartOrg",
        lastName: "User",
        role: "organizer",
      });
      const trip = new Trip({
        title: "Participants Trip",
        destination: "Test",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
        participants: [user._id],
      });
      await trip.save();
      const res = await request(app)
        .get(`/api/trips/${trip._id}/participants`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].firstName).toBe("Part");
    });
  });

  describe("GET /api/trips/:id/applications (organizer only)", () => {
    it("should return applications for organizer", async () => {
      const orgData = await getAuthTokens({
        email: "apporg@test.com",
        password: "pass123",
        firstName: "AppOrg",
        lastName: "User",
        role: "organizer",
      });
      const trip = new Trip({
        title: "App Trip",
        destination: "Test",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
      });
      await trip.save();
      const res = await request(app)
        .get(`/api/trips/${trip._id}/applications`)
        .set("Authorization", `Bearer ${orgData.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.pending).toBeDefined();
    });

    it("should return 403 for non-organizer", async () => {
      const userData = await getAuthTokens({
        email: "nonorg@test.com",
        password: "pass123",
        firstName: "Non",
        lastName: "Org",
        role: "user",
      });
      const orgData = await getAuthTokens({
        email: "otherapporg@test.com",
        password: "pass123",
        firstName: "Other",
        lastName: "Org",
        role: "organizer",
      });
      const trip = new Trip({
        title: "Other Trip",
        destination: "Test",
        description: "Desc",
        startDate: new Date(),
        endDate: new Date(),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
      });
      await trip.save();
      const res = await request(app)
        .get(`/api/trips/${trip._id}/applications`)
        .set("Authorization", `Bearer ${userData.accessToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/trips with filters", () => {
    it("should filter by minDuration and maxDuration", async () => {
      const orgData = await getAuthTokens({
        email: "filterorg@test.com",
        password: "pass123",
        firstName: "Filter",
        lastName: "Org",
        role: "organizer",
      });
      const shortTrip = new Trip({
        title: "Short",
        destination: "A",
        description: "Desc",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-03"),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
      });
      const longTrip = new Trip({
        title: "Long",
        destination: "B",
        description: "Desc",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-10"),
        price: 10,
        maxParticipants: 5,
        createdBy: orgData.user._id,
      });
      await shortTrip.save();
      await longTrip.save();

      const res = await request(app).get(
        "/api/trips?minDuration=5&maxDuration=7",
      );
      expect(res.status).toBe(200);
    });
    it("should filter by destination", async () => {
      const res = await request(app).get("/api/trips?destination=Mountains");
      expect(res.status).toBe(200);
    });

    it("should filter by startDate", async () => {
      const res = await request(app).get("/api/trips?startDate=2025-01-01");
      expect(res.status).toBe(200);
    });

    it("should handle invalid price range", async () => {
      const res = await request(app).get(
        "/api/trips?minPrice=200&maxPrice=100",
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(
        /Минимальная цена не может быть больше максимальной/,
      );
    });

    it("should handle search by title", async () => {
      const res = await request(app).get("/api/trips?search=Trip");
      expect(res.status).toBe(200);
    });
  });
});
