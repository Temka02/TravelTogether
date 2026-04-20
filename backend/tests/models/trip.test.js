const Trip = require("../../src/models/Trip");
const User = require("../../src/models/User");

describe("Trip Model", () => {
  let creator;

  beforeEach(async () => {
    creator = new User({
      email: "creator@test.com",
      password: "password123",
      firstName: "Creator",
      lastName: "Trip",
    });
    await creator.save();
  });

  it("should create trip with valid data", async () => {
    const tripData = {
      title: "Mountain Hike",
      destination: "Alps",
      description: "Beautiful mountains",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-07-10"),
      price: 500,
      maxParticipants: 10,
      createdBy: creator._id,
    };
    const trip = new Trip(tripData);
    await trip.save();
    expect(trip._id).toBeDefined();
    expect(trip.status).toBe("planning");
    expect(trip.difficulty).toBe("medium"); // default
  });

  it("should require required fields", async () => {
    const trip = new Trip({});
    let err;
    try {
      await trip.save();
    } catch (error) {
      err = error;
    }
    expect(err.errors.title).toBeDefined();
    expect(err.errors.destination).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.startDate).toBeDefined();
    expect(err.errors.endDate).toBeDefined();
    expect(err.errors.price).toBeDefined();
    expect(err.errors.maxParticipants).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  it("should compute virtual fields", async () => {
    const trip = new Trip({
      title: "Test",
      destination: "Paris",
      description: "Fun",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-05"),
      price: 100,
      maxParticipants: 8,
      createdBy: creator._id,
      participants: [creator._id],
    });
    await trip.save();
    expect(trip.currentParticipants).toBe(1);
    expect(trip.durationDays).toBe(4);
    expect(trip.availableSpots).toBe(7);
  });

  it("should update status based on dates", () => {
    const trip = new Trip({
      title: "Date Test",
      destination: "Test",
      description: "Test",
      startDate: new Date(Date.now() + 86400000), // tomorrow
      endDate: new Date(Date.now() + 86400000 * 3),
      price: 100,
      maxParticipants: 5,
      createdBy: creator._id,
    });
    trip.updateStatus();
    expect(trip.status).toBe("planning");

    const activeTrip = new Trip({
      title: "Active",
      destination: "Test",
      description: "Test",
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      price: 100,
      maxParticipants: 5,
      createdBy: creator._id,
    });
    activeTrip.updateStatus();
    expect(activeTrip.status).toBe("active");

    const completedTrip = new Trip({
      title: "Completed",
      destination: "Test",
      description: "Test",
      startDate: new Date(Date.now() - 86400000 * 5),
      endDate: new Date(Date.now() - 86400000 * 2),
      price: 100,
      maxParticipants: 5,
      createdBy: creator._id,
    });
    completedTrip.updateStatus();
    expect(completedTrip.status).toBe("completed");
  });
});
