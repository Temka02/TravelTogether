const request = require("supertest");
const { app, getAuthTokens } = require("../helpers/app");

describe("Full User Journey", () => {
  let userToken, organizerToken, tripId;

  beforeAll(async () => {
    const user = await getAuthTokens({
      email: "e2e@test.com",
      password: "e2epass123",
      firstName: "E2E",
      lastName: "User",
      role: "user",
    });
    userToken = user.accessToken;

    const org = await getAuthTokens({
      email: "e2eorg@test.com",
      password: "orgpass123",
      firstName: "E2EOrg",
      lastName: "User",
      role: "organizer",
    });
    organizerToken = org.accessToken;
  });

  it("should complete full journey: create trip, apply, accept, see participant", async () => {
    const createRes = await request(app)
      .post("/api/trips")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "E2E Trip",
        destination: "Mountains",
        description: "Test E2E",
        startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        endDate: new Date(Date.now() + 86400000 * 3)
          .toISOString()
          .split("T")[0],
        price: 99,
        maxParticipants: 5,
      });
    expect(createRes.status).toBe(201);
    tripId = createRes.body.data._id;

    const applyRes = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ tripId, message: "I want to join" });
    expect(applyRes.status).toBe(201);

    const appsRes = await request(app)
      .get("/api/applications/to-my-trips")
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(appsRes.status).toBe(200);
    expect(appsRes.body.data.length).toBeGreaterThan(0);
    const applicationId = appsRes.body.data[0]._id;
    const acceptRes = await request(app)
      .put(`/api/applications/${applicationId}/accept`)
      .set("Authorization", `Bearer ${organizerToken}`);
    expect(acceptRes.status).toBe(200);

    const tripRes = await request(app).get(`/api/trips/${tripId}`);
    expect(tripRes.status).toBe(200);
    expect(tripRes.body.data.participants).toHaveLength(1);
  });
});
