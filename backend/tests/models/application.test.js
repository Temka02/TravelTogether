const Application = require("../../src/models/Application");
const User = require("../../src/models/User");
const Trip = require("../../src/models/Trip");

describe("Application Model", () => {
  let user, trip;

  beforeEach(async () => {
    user = new User({
      email: "appuser@test.com",
      password: "password123",
      firstName: "App",
      lastName: "User",
    });
    await user.save();

    const creator = new User({
      email: "creator2@test.com",
      password: "password123",
      firstName: "Creator",
      lastName: "Trip",
    });
    await creator.save();

    trip = new Trip({
      title: "Trip for app",
      destination: "Test",
      description: "Desc",
      startDate: new Date(),
      endDate: new Date(),
      price: 10,
      maxParticipants: 5,
      createdBy: creator._id,
    });
    await trip.save();
  });

  it("should create application with pending status", async () => {
    const app = new Application({
      userId: user._id,
      tripId: trip._id,
      message: "I want to join",
    });
    await app.save();
    expect(app.status).toBe("pending");
    expect(app.appliedAt).toBeDefined();
    expect(app.processedAt).toBeUndefined();
  });

  it("should set processedAt when status changes", async () => {
    const app = new Application({
      userId: user._id,
      tripId: trip._id,
    });
    await app.save();
    app.status = "accepted";
    await app.save();
    expect(app.processedAt).toBeDefined();
  });

  it("should enforce unique userId+tripId", async () => {
    const app1 = new Application({ userId: user._id, tripId: trip._id });
    await app1.save();
    const app2 = new Application({ userId: user._id, tripId: trip._id });
    let err;
    try {
      await app2.save();
    } catch (error) {
      err = error;
    }
    expect(err.code).toBe(11000);
  });
});
