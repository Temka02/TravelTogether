const RefreshToken = require("../../src/models/RefreshToken");
const User = require("../../src/models/User");

describe("RefreshToken Model", () => {
  let user;

  beforeEach(async () => {
    user = new User({
      email: "refresh@test.com",
      password: "validpass",
      firstName: "Refresh",
      lastName: "Token",
    });
    await user.save();
  });

  it("should create refresh token", async () => {
    const token = new RefreshToken({
      token: "some-refresh-token-string",
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
    await token.save();
    expect(token._id).toBeDefined();
    expect(token.createdAt).toBeDefined();
  });

  it("should enforce unique token", async () => {
    const t1 = new RefreshToken({
      token: "same",
      user: user._id,
      expiresAt: new Date(),
    });
    await t1.save();
    const t2 = new RefreshToken({
      token: "same",
      user: user._id,
      expiresAt: new Date(),
    });
    let err;
    try {
      await t2.save();
    } catch (error) {
      err = error;
    }
    expect(err.code).toBe(11000);
  });
});
