const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test", override: false });
} else {
  dotenv.config({ override: false });
}
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

require("./src/swagger")(app);

const authAccess = require("./src/middleware/authAccess");

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/trips", require("./src/routes/trips"));
app.use("/api/applications", require("./src/routes/application"));
app.use("/api/admin", authAccess, require("./src/routes/admin"));
app.use("/api/weather", require("./src/routes/weather"));

app.use("/", require("./src/routes/sitemap"));
app.use("/", require("./src/routes/robots"));

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
