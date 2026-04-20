/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Управление заявками на поездки
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       required:
 *         - userId
 *         - tripId
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         tripId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         message:
 *           type: string
 *         appliedAt:
 *           type: string
 *           format: date-time
 *         processedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Trip = require("../models/Trip");
const User = require("../models/User");
const auth = require("../middleware/authAccess");
const checkPermission = require("../middleware/checkPermission");
const { ROLES } = require("../config/permissions");

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Подать заявку на поездку
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *             properties:
 *               tripId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Заявка успешно подана
 *       400:
 *         description: Ошибка валидации или уже подана заявка
 *       404:
 *         description: Поездка не найдена
 *       500:
 *         description: Ошибка сервера
 */
// POST /api/applications - подать заявку на поездку
router.post(
  "/",
  auth,
  checkPermission("application:create"),
  async (req, res) => {
    try {
      const { tripId, message } = req.body;
      const userId = req.user._id;

      console.log("POST /applications request:", { tripId, userId, message });

      const trip = await Trip.findById(tripId).lean();
      if (!trip) {
        console.log("Trip not found:", tripId);
        return res.status(404).json({
          success: false,
          error: "Поездка не найдена",
        });
      }

      if (trip.createdBy.toString() === userId.toString()) {
        console.log("User is organizer:", userId);
        return res.status(400).json({
          success: false,
          error: "Организатор не может подавать заявку на свою поездку",
        });
      }

      if (
        trip.participants &&
        trip.participants.some((p) => p.toString() === userId.toString())
      ) {
        console.log("User already participant:", userId);
        return res.status(400).json({
          success: false,
          error: "Вы уже участник этой поездки",
        });
      }

      const existingApplication = await Application.findOne({
        userId: userId,
        tripId: tripId,
      });

      if (existingApplication) {
        console.log("Application already exists:", existingApplication._id);
        return res.status(400).json({
          success: false,
          error: "Вы уже подали заявку на эту поездку",
        });
      }

      const application = new Application({
        userId,
        tripId,
        message: message || "",
      });

      const savedApplication = await application.save();

      res.status(201).json({
        success: true,
        data: {
          _id: savedApplication._id,
          userId: savedApplication.userId,
          tripId: savedApplication.tripId,
          status: savedApplication.status,
          message: savedApplication.message,
          appliedAt: savedApplication.appliedAt,
        },
      });
    } catch (error) {
      console.error("POST /applications error:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: "Вы уже подали заявку на эту поездку",
        });
      }
      res.status(500).json({
        success: false,
        error: "Server Error",
      });
    }
  },
);

/**
 * @swagger
 * /api/applications/{id}/accept:
 *   put:
 *     summary: Принять заявку на поездку (только организатор)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заявки
 *     responses:
 *       200:
 *         description: Заявка принята
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Заявка не найдена
 *       400:
 *         description: Нет свободных мест
 *       500:
 *         description: Ошибка сервера
 */
// PUT /api/applications/:id/accept - принять заявку
router.put(
  "/:id/accept",
  auth,
  checkPermission("application:accept"),
  async (req, res) => {
    try {
      const applicationId = req.params.id;

      const application =
        await Application.findById(applicationId).populate("tripId");

      if (!application) {
        return res.status(404).json({
          success: false,
          error: "Заявка не найдена",
        });
      }

      if (application.tripId.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: "Только организатор может принимать заявки",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Заявка уже обработана",
        });
      }

      const trip = application.tripId;
      if (trip.participants.length >= trip.maxParticipants) {
        return res.status(400).json({
          success: false,
          error: "Нет свободных мест в поездке",
        });
      }

      application.status = "accepted";
      await application.save();

      trip.participants.push(application.userId);
      await trip.save();

      await User.findByIdAndUpdate(application.userId, {
        $inc: { tripsAsParticipant: 1 },
        $addToSet: { joinedTrips: trip._id },
      });

      const updatedApplication = await Application.findById(applicationId)
        .populate("userId", "firstName lastName email phone skills")
        .populate("tripId", "title destination");

      res.json({
        success: true,
        data: updatedApplication,
        message: "Заявка принята",
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
 * /api/applications/{id}/reject:
 *   put:
 *     summary: Отклонить заявку на поездку (только организатор)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заявки
 *     responses:
 *       200:
 *         description: Заявка отклонена
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Заявка не найдена
 *       500:
 *         description: Ошибка сервера
 */
// PUT /api/applications/:id/reject - отклонить заявку
router.put(
  "/:id/reject",
  auth,
  checkPermission("application:reject"),
  async (req, res) => {
    try {
      const applicationId = req.params.id;

      const application =
        await Application.findById(applicationId).populate("tripId");

      if (!application) {
        return res.status(404).json({
          success: false,
          error: "Заявка не найдена",
        });
      }

      if (application.tripId.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: "Только организатор может отклонять заявки",
        });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Заявка уже обработана",
        });
      }

      application.status = "rejected";
      await application.save();

      const updatedApplication = await Application.findById(applicationId)
        .populate("userId", "firstName lastName")
        .populate("tripId", "title destination");

      res.json({
        success: true,
        data: updatedApplication,
        message: "Заявка отклонена",
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
 * /api/applications/my:
 *   get:
 *     summary: Получить мои заявки
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список моих заявок
 *       500:
 *         description: Ошибка сервера
 */
// GET /api/applications/my - получить мои заявки
router.get(
  "/my",
  auth,
  checkPermission("application:read:own"),
  async (req, res) => {
    try {
      const applications = await Application.find({ userId: req.user._id })
        .populate({
          path: "tripId",
          select: "title destination startDate endDate price difficulty",
          populate: {
            path: "createdBy",
            select: "firstName lastName",
          },
        })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      console.error("Error fetching my applications:", error);
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);

/**
 * @swagger
 * /api/applications/to-my-trips:
 *   get:
 *     summary: Получить заявки на мои поездки (как организатора)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список заявок на мои поездки
 *       500:
 *         description: Ошибка сервера
 */
// GET /api/applications/to-my-trips - получить заявки на мои поездки (как организатора)
router.get(
  "/to-my-trips",
  auth,
  checkPermission("application:read:as-organizer"),
  async (req, res) => {
    try {
      const myTrips = await Trip.find({ createdBy: req.user._id });
      const tripIds = myTrips.map((trip) => trip._id);

      const applications = await Application.find({
        tripId: { $in: tripIds },
        status: { $in: ["pending", "rejected"] },
      })
        .populate(
          "userId",
          "firstName lastName email phone skills allergies medicalConditions dietaryRestrictions",
        )
        .populate(
          "tripId",
          "title destination startDate endDate maxParticipants participants",
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      console.error("Error fetching applications to my trips:", error);
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);

/**
 * @swagger
 * /api/applications/check/{tripId}:
 *   get:
 *     summary: Проверить заявку пользователя на поездку
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID поездки
 *     responses:
 *       200:
 *         description: Заявка найдена
 *       404:
 *         description: Заявка не найдена
 */
// GET /api/applications/check/:tripId - проверить заявку пользователя на поездку
router.get("/check/:tripId", auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user._id;
    const application = await Application.findOne({
      userId: userId,
      tripId: tripId,
    }).lean();

    if (!application) {
      return res.status(200).json({
        success: true,
        application: null,
      });
    }

    res.json({
      success: true,
      application: application,
    });
  } catch (error) {
    console.error("Error checking application:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// DELETE /api/applications/:id - удалить свою заявку
router.delete(
  "/:id",
  auth,
  checkPermission("application:delete"),
  async (req, res) => {
    try {
      const application = await Application.findById(req.params.id).populate(
        "tripId",
      );
      if (!application) {
        return res
          .status(404)
          .json({ success: false, error: "Заявка не найдена" });
      }

      const userId = req.user._id.toString();
      const isOwner = application.userId.toString() === userId;
      const isOrganizer =
        application.tripId &&
        application.tripId.createdBy.toString() === userId;
      const isAdmin = req.user.role === ROLES.ADMIN;

      if (!isOwner && !isOrganizer && !isAdmin) {
        return res
          .status(403)
          .json({ success: false, error: "Нет прав на удаление заявки" });
      }

      if (application.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: "Нельзя удалить обработанную заявку",
        });
      }

      await application.deleteOne();
      res.json({ success: true, message: "Заявка удалена" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server Error" });
    }
  },
);
module.exports = router;
