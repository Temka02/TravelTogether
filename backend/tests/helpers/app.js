const jwt = require("jsonwebtoken");
const User = require("../../src/models/User");

let app;
try {
  app = require("../../server");
} catch (e) {
  const express = require("express");
  const cors = require("cors");
  app = express();
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
  app.use(express.json());
  require("../../src/swagger")(app);
  app.use("/api/auth", require("../../src/routes/auth"));
  app.use("/api/trips", require("../../src/routes/trips"));
  app.use("/api/applications", require("../../src/routes/application"));
  app.use(
    "/api/admin",
    require("../../src/middleware/authAccess"),
    require("../../src/routes/admin"),
  );
  app.use("/api/weather", require("../../src/routes/weather"));
  app.use("/", require("../../src/routes/sitemap"));
  app.use("/", require("../../src/routes/robots"));
}

const getAuthTokens = async (userData) => {
  if (userData.password && userData.password.length < 6) {
    userData.password = userData.password.padEnd(6, "x");
  }
  let user = await User.findOne({ email: userData.email });
  if (!user) {
    user = new User(userData);
    await user.save();
  } else if (userData.role && user.role !== userData.role) {
    user.role = userData.role;
    await user.save();
  }
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_ACCESS_SECRET || "test_access_secret",
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || "test_refresh_secret",
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken, user };
};

module.exports = { app, getAuthTokens };
