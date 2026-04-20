const User = require("../../src/models/User");
const bcrypt = require("bcryptjs");

describe("User Model", () => {
  it("should create user with valid data", async () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };
    const user = new User(userData);
    await user.save();

    expect(user._id).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("user");
    expect(user.password).not.toBe("password123");
  });

  it("should hash password on save", async () => {
    const user = new User({
      email: "hash@test.com",
      password: "plainpass",
      firstName: "Hash",
      lastName: "Test",
    });
    await user.save();
    expect(user.password).not.toBe("plainpass");
    const isMatch = await bcrypt.compare("plainpass", user.password);
    expect(isMatch).toBe(true);
  });

  it("should compare password correctly", async () => {
    const user = new User({
      email: "compare@test.com",
      password: "secret",
      firstName: "Compare",
      lastName: "User",
    });
    await user.save();
    const isMatch = await user.comparePassword("secret");
    expect(isMatch).toBe(true);
    const isNotMatch = await user.comparePassword("wrong");
    expect(isNotMatch).toBe(false);
  });

  it("should require email, password, firstName, lastName", async () => {
    const user = new User({});
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
    expect(err.errors.firstName).toBeDefined();
    expect(err.errors.lastName).toBeDefined();
  });

  it("should enforce unique email", async () => {
    const user1 = new User({
      email: "unique@test.com",
      password: "password123",
      firstName: "A",
      lastName: "B",
    });
    await user1.save();

    const user2 = new User({
      email: "unique@test.com",
      password: "password123",
      firstName: "C",
      lastName: "D",
    });
    let err;
    try {
      await user2.save();
    } catch (error) {
      err = error;
    }
    expect(err.code).toBe(11000);
  });

  it("should validate email format", async () => {
    const user = new User({
      email: "invalid-email",
      password: "password123",
      firstName: "X",
      lastName: "Y",
    });
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err.errors.email).toBeDefined();
  });

  it("should not return password in toJSON", async () => {
    const user = new User({
      email: "tojson@test.com",
      password: "password123",
      firstName: "JSON",
      lastName: "Test",
    });
    await user.save();
    const obj = user.toJSON();
    expect(obj.password).toBeUndefined();
  });
});

describe("User Model - mainSkills validation", () => {
  it("should allow empty mainSkills", async () => {
    const user = new User({
      email: "noskills@test.com",
      password: "password123",
      firstName: "No",
      lastName: "Skills",
      skills: [],
      mainSkills: [],
    });
    await expect(user.save()).resolves.toBeDefined();
  });

  it("should allow mainSkills that are subset of skills", async () => {
    const user = new User({
      email: "validskills@test.com",
      password: "password123",
      firstName: "Valid",
      lastName: "Skills",
      skills: ["hiking", "swimming", "cooking"],
      mainSkills: ["hiking", "cooking"],
    });
    await expect(user.save()).resolves.toBeDefined();
  });

  it("should reject more than 3 mainSkills", async () => {
    const user = new User({
      email: "toomanyskills@test.com",
      password: "password123",
      firstName: "Too",
      lastName: "Many",
      skills: ["a", "b", "c", "d"],
      mainSkills: ["a", "b", "c", "d"],
    });
    let err;
    try {
      await user.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeDefined();
    expect(err.errors.mainSkills).toBeDefined();
  });

  it("should handle skills and mainSkills case-insensitive trim", async () => {
    const user = new User({
      email: "case@test.com",
      password: "password123",
      firstName: "Case",
      lastName: "Test",
      skills: ["  Hiking  ", "Swimming"],
      mainSkills: ["hiking", "SWIMMING"],
    });
    await user.save();
    expect(user.mainSkills).toEqual(["hiking", "SWIMMING"]);
  });
});
