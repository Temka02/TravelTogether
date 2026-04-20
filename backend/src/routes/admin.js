/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Административные endpoints (только для admin)
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const checkRole = require("../middleware/checkRole");
const { ROLES } = require("../config/permissions");

router.use(checkRole([ROLES.ADMIN]));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Получить список пользователей (только администратор)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Количество записей на странице
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [guest, user, organizer, admin]
 *         description: Фильтр по роли
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по имени, фамилии или email
 *     responses:
 *       200:
 *         description: Список пользователей с пагинацией
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав (требуется роль admin)
 */
// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const count = await User.countDocuments(filter);
    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Ошибка получения пользователей" });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Изменить роль пользователя (только администратор)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [guest, user, organizer, admin]
 *                 example: organizer
 *     responses:
 *       200:
 *         description: Роль успешно обновлена
 *       400:
 *         description: Невалидная роль
 *       401:
 *         description: Не авторизован
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Пользователь не найден
 */
// PUT /api/admin/users/:id/role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ success: false, error: "Невалидная роль" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "Пользователь не найден" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: "Ошибка обновления роли" });
  }
});

module.exports = router;
