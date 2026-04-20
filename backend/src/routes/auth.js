const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const authAccess = require("../middleware/authAccess");
const { PERMISSIONS } = require("../config/permissions");

const router = express.Router();

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const { uploadFile, getFileUrl } = require("../utils/file.service");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация и авторизация пользователей
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           example: Иван
 *           description: Имя пользователя
 *         lastName:
 *           type: string
 *           example: Иванов
 *           description: Фамилия пользователя
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: Email пользователя
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: password123
 *           description: Пароль (минимум 6 символов)
 *         phone:
 *           type: string
 *           example: +79161234567
 *           description: Номер телефона (необязательно)
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *
 *     RefreshRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token для получения нового access token
 *
 *     LogoutRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token для удаления
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID пользователя
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         mainSkills:
 *           type: array
 *           items:
 *             type: string
 *         aboutMe:
 *           type: string
 *         allergies:
 *           type: array
 *           items:
 *             type: string
 *         medicalConditions:
 *           type: array
 *           items:
 *             type: string
 *         dietaryRestrictions:
 *           type: array
 *           items:
 *             type: string
 *         tripsAsOrganizer:
 *           type: number
 *         tripsAsParticipant:
 *           type: number
 *         organizedTrips:
 *           type: array
 *           items:
 *             type: string
 *         joinedTrips:
 *           type: array
 *           items:
 *             type: string
 *
 *     AuthSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         accessToken:
 *           type: string
 *           description: Access token (действует 15 минут)
 *         refreshToken:
 *           type: string
 *           description: Refresh token (действует 7 дней)
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *
 *     RefreshSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         accessToken:
 *           type: string
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Описание ошибки
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           description: Детали ошибки валидации
 *
 *     ProfileUpdateRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         mainSkills:
 *           type: array
 *           items:
 *             type: string
 *         aboutMe:
 *           type: string
 *         allergies:
 *           type: array
 *           items:
 *             type: string
 *         medicalConditions:
 *           type: array
 *           items:
 *             type: string
 *         dietaryRestrictions:
 *           type: array
 *           items:
 *             type: string
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Введите access token в формате "Bearer {token}"
 */

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     description: Создает нового пользователя и возвращает токены авторизации
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             example1:
 *               summary: Пример регистрации
 *               value:
 *                 firstName: "Иван"
 *                 lastName: "Иванов"
 *                 email: "ivan@example.com"
 *                 password: "password123"
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   user:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     firstName: "Иван"
 *                     lastName: "Иванов"
 *                     email: "ivan@example.com"
 *       400:
 *         description: Ошибка валидации или email уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Пользователь с таким email уже существует",
      });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: "user",
    });

    await user.save();

    // Генерируем токены
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Сохраняем refresh token в базе
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 дней

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: refreshTokenExpires,
    });

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Ошибка валидации",
        details: errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Пользователь с таким email уже существует",
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     description: Аутентификация пользователя и получение токенов
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             example1:
 *               summary: Пример входа
 *               value:
 *                 email: "ivan@example.com"
 *                 password: "password123"
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: Неверные учетные данные
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Неверный email или пароль",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: "Неверный email или пароль",
      });
    }

    // Генерируем токены
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Сохраняем refresh token в базе
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: refreshTokenExpires,
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tripsAsOrganizer: user.tripsAsOrganizer,
        tripsAsParticipant: user.tripsAsParticipant,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление access token
 *     tags: [Auth]
 *     description: Получение нового access token с помощью refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           examples:
 *             example1:
 *               summary: Пример обновления токена
 *               value:
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Новый access token успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshSuccessResponse'
 *       400:
 *         description: Отсутствует refresh token
 *       401:
 *         description: Неверный или истекший refresh token
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/refresh", async (req, res) => {
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

    await storedToken.deleteOne();

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    await RefreshToken.create({
      token: newRefreshToken,
      user: decoded.userId,
      expiresAt: refreshTokenExpires,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
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

    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Auth]
 *     description: Удаление refresh token (выход из всех устройств при использовании одного токена)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *           examples:
 *             example1:
 *               summary: Пример выхода
 *               value:
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Успешный выход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Выход выполнен успешно"
 *       400:
 *         description: Отсутствует refresh token
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token отсутствует",
      });
    }

    // Удаляем refresh token из базы
    await RefreshToken.deleteOne({ token: refreshToken });

    res.json({
      success: true,
      message: "Выход выполнен успешно",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     description: Получение информации о текущем авторизованном пользователе
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя успешно получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Не авторизован (отсутствует или неверный токен)
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/me", authAccess, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("organizedTrips")
      .populate("joinedTrips");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Обновить профиль пользователя
 *     tags: [Auth]
 *     description: Обновление информации профиля пользователя
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *           examples:
 *             example1:
 *               summary: Пример обновления профиля
 *               value:
 *                 firstName: "Иван"
 *                 lastName: "Иванов"
 *                 phone: "+79161234567"
 *                 skills: ["Кулинария", "Навигация"]
 *                 mainSkills: ["Кулинария"]
 *                 aboutMe: "Люблю путешествовать"
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.put("/update-profile", authAccess, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      skills,
      mainSkills,
      aboutMe,
      allergies,
      medicalConditions,
      dietaryRestrictions,
    } = req.body;

    const updateData = {
      firstName,
      lastName,
      phone,
      skills,
      mainSkills,
      aboutMe,
      allergies,
      medicalConditions,
      dietaryRestrictions,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("organizedTrips")
      .populate("joinedTrips");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/auth/permissions:
 *   get:
 *     summary: Получить список разрешений текущего пользователя
 *     tags: [Auth]
 *     description: Возвращает массив строк с названиями разрешений, доступных текущей роли пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список разрешений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["trip:read", "trip:create", "application:create", "user:read:own"]
 *       401:
 *         description: Не авторизован (отсутствует или неверный токен)
 */
router.get("/permissions", authAccess, async (req, res) => {
  const role = req.user.role;
  const userPermissions = Object.entries(PERMISSIONS)
    .filter(([_, roles]) => roles.includes(role))
    .map(([permission]) => permission);
  res.json({ success: true, permissions: userPermissions });
});

// POST /api/auth/avatar – загрузка аватара
router.post(
  "/avatar",
  authAccess,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Файл не загружен" });
      }

      const fileKey = await uploadFile(
        req.file.buffer,
        req.file.mimetype,
        "avatars",
      );

      await User.findByIdAndUpdate(req.user._id, { avatarKey: fileKey });

      const avatarUrl = await getFileUrl(fileKey);

      res.json({ success: true, avatarUrl });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res
        .status(500)
        .json({ success: false, error: "Ошибка загрузки аватара" });
    }
  },
);

// GET /api/auth/avatar – получение URL аватара текущего пользователя
router.get("/avatar", authAccess, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("avatarKey");
    if (!user || !user.avatarKey) {
      return res.json({ success: true, avatarUrl: null });
    }
    const avatarUrl = await getFileUrl(user.avatarKey);
    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Get avatar error:", error);
    res.status(500).json({ success: false, error: "Ошибка получения аватара" });
  }
});

module.exports = router;
