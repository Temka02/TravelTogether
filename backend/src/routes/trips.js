/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Управление поездками
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       required:
 *         - title
 *         - destination
 *         - description
 *         - startDate
 *         - endDate
 *         - price
 *         - maxParticipants
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         destination:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         price:
 *           type: number
 *         maxParticipants:
 *           type: number
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *         createdBy:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [planning, active, completed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "507f1f77bcf86cd799439011"
 *         title: "Поход в горы"
 *         destination: "Альпы"
 *         description: "Незабываемый поход по Альпам"
 *         startDate: "2024-07-01"
 *         endDate: "2024-07-10"
 *         price: 500
 *         maxParticipants: 10
 *         difficulty: "medium"
 *         createdBy: "507f1f77bcf86cd799439012"
 *         visibility: "public"
 *         status: "planning"
 */

const auth = require("../middleware/authAccess");
const express = require("express");
const router = express.Router();
const Trip = require("../models/Trip");
const User = require("../models/User");
const Application = require("../models/Application");
const checkPermission = require("../middleware/checkPermission");
const checkOwnership = require("../middleware/checkOwnership");

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Получить все публичные поездки
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Количество элементов на странице
 *     responses:
 *       200:
 *         description: Список поездок
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Ошибка сервера
 */
// GET /api/trips - получить все публичные поездки
router.get("/", checkPermission("trip:read"), async (req, res) => {
  try {
    const {
      destination,
      startDate,
      minPrice,
      maxPrice,
      difficulty,
      minDuration,
      maxDuration,
      status = "planning,active",
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (destination) {
      filter.destination = new RegExp(destination, "i");
    }

    if (startDate) {
      filter.startDate = { $gte: new Date(startDate) };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        const min = Number(minPrice);
        if (min >= 0) filter.price.$gte = min;
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        if (max >= 0) filter.price.$lte = max;
      }

      if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
        return res.status(400).json({
          success: false,
          error: "Минимальная цена не может быть больше максимальной",
        });
      }
    }

    if (difficulty) {
      filter.difficulty = { $in: difficulty.split(",") };
    }

    if (status) {
      filter.status = { $in: status.split(",") };
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let trips = await Trip.find(filter)
      .populate("createdBy", "firstName lastName")
      .populate("participants", "firstName lastName")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    if (minDuration || maxDuration) {
      trips = trips.filter((trip) => {
        const durationDays = Math.ceil(
          (trip.endDate - trip.startDate) / (1000 * 60 * 60 * 24),
        );

        if (minDuration && durationDays < Number(minDuration)) return false;
        if (maxDuration && durationDays > Number(maxDuration)) return false;

        return true;
      });
    }

    const now = new Date();
    for (let trip of trips) {
      let newStatus = trip.status;

      if (trip.status !== "cancelled") {
        if (now < trip.startDate) {
          newStatus = "planning";
        } else if (now >= trip.startDate && now <= trip.endDate) {
          newStatus = "active";
        } else if (now > trip.endDate) {
          newStatus = "completed";
        }

        if (newStatus !== trip.status) {
          await Trip.findByIdAndUpdate(trip._id, { status: newStatus });
          trip.status = newStatus;
        }
      }
    }

    const total = await Trip.countDocuments(filter);

    res.json({
      success: true,
      data: trips,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
});

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Получить поездку по ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поездки
 *     responses:
 *       200:
 *         description: Данные поездки
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Поездка не найдена
 *       400:
 *         description: Неверный ID
 *       500:
 *         description: Ошибка сервера
 */
// GET /api/trips/:id - получить поездку по ID
router.get("/:id", checkPermission("trip:read"), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("createdBy", "firstName lastName email phone")
      .populate("participants", "firstName lastName mainSkills");

    if (!trip) {
      return res.status(404).json({ success: false, error: "Trip not found" });
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

/**
 * @swagger
 * /api/trips:
 *   post:
 *     summary: Создать новую поездку
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - destination
 *               - description
 *               - startDate
 *               - endDate
 *               - price
 *               - maxParticipants
 *             properties:
 *               title:
 *                 type: string
 *               destination:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               price:
 *                 type: number
 *               maxParticipants:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *     responses:
 *       201:
 *         description: Поездка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
// POST /api/trips - создать поездку
router.post("/", auth, checkPermission("trip:create"), async (req, res) => {
  try {
    const tripData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const trip = new Trip(tripData);
    const savedTrip = await trip.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { organizedTrips: savedTrip._id },
      $inc: { tripsAsOrganizer: 1 },
    });

    const populatedTrip = await Trip.findById(savedTrip._id)
      .populate("createdBy", "firstName lastName")
      .populate("participants", "firstName lastName");

    res.status(201).json({ success: true, data: populatedTrip });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

/**
 * @swagger
 * /api/trips/{id}:
 *   put:
 *     summary: Обновить поездку
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поездки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trip'
 *     responses:
 *       200:
 *         description: Поездка успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Поездка не найдена
 *       500:
 *         description: Ошибка сервера
 */
// PUT /api/trips/:id - обновить поездку
router.put(
  "/:id",
  auth,
  checkPermission("trip:update"),
  checkOwnership(Trip, "id"),
  async (req, res) => {
    try {
      const existingTrip = await Trip.findById(req.params.id);
      if (!existingTrip) {
        return res
          .status(404)
          .json({ success: false, error: "Trip not found" });
      }

      const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("createdBy", "firstName lastName")
        .populate("participants", "firstName lastName");

      res.json({ success: true, data: trip });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     summary: Удалить поездку
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поездки
 *     responses:
 *       200:
 *         description: Поездка успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Поездка не найдена
 *       500:
 *         description: Ошибка сервера
 */
// DELETE /api/trips/:id - удалить поездку
router.delete(
  "/:id",
  auth,
  checkPermission("trip:delete"),
  checkOwnership(Trip, "id"),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.id);

      if (!trip) {
        return res
          .status(404)
          .json({ success: false, error: "Trip not found" });
      }

      await Trip.findByIdAndDelete(req.params.id);

      await User.findByIdAndUpdate(trip.createdBy, {
        $pull: { organizedTrips: trip._id },
        $inc: { tripsAsOrganizer: -1 },
      });

      res.json({ success: true, message: "Trip deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);

/**
 * @swagger
 * /api/trips/{id}/participants:
 *   get:
 *     summary: Получить участников поездки (доступно всем авторизованным пользователям)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поездки
 *     responses:
 *       200:
 *         description: Список участников поездки
 *       404:
 *         description: Поездка не найдена
 */
// GET /api/trips/:id/participants - получить участников поездки
router.get(
  "/:id/participants",
  checkPermission("trip:read"),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.id);

      if (!trip) {
        return res
          .status(404)
          .json({ success: false, error: "Trip not found" });
      }

      const participants = await User.find({
        _id: { $in: trip.participants },
      }).select(
        "firstName lastName skills mainSkills aboutMe tripsAsOrganizer tripsAsParticipant",
      );

      res.json({
        success: true,
        data: participants,
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);

/**
 * @swagger
 * /api/trips/{id}/applications:
 *   get:
 *     summary: Получить заявки на поездку (только для организатора)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поездки
 *     responses:
 *       200:
 *         description: Список заявок на поездку
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Поездка не найдена
 */
// GET /api/trips/:id/applications - получить заявки на участие(для организаторов)
router.get(
  "/:id/applications",
  auth,
  checkPermission("application:read:as-organizer"),
  checkOwnership(Trip, "id"),
  async (req, res) => {
    try {
      const trip = await Trip.findById(req.params.id);

      if (!trip) {
        return res
          .status(404)
          .json({ success: false, error: "Trip not found" });
      }

      const applications = await Application.find({
        tripId: req.params.id,
      }).populate(
        "userId",
        "firstName lastName skills mainSkills aboutMe tripsAsOrganizer tripsAsParticipant",
      );

      res.json({
        success: true,
        data: {
          pending: applications.filter((app) => app.status === "pending"),
          rejected: applications.filter((app) => app.status === "rejected"),
        },
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);

module.exports = router;
