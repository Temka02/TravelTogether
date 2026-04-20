const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");

const authRefresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token отсутствует",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: decoded.userId,
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token не найден или отозван",
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await storedToken.deleteOne();
      return res.status(401).json({
        success: false,
        error: "Refresh token истек",
      });
    }

    req.userId = decoded.userId;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Refresh token истек",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Неверный refresh token",
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка сервера при проверке refresh token",
    });
  }
};

module.exports = authRefresh;
