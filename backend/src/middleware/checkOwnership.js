const checkOwnership = (model, paramId = "id") => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Требуется авторизация",
      });
    }

    if (req.user.role === "admin") {
      return next();
    }

    try {
      const resource = await model.findById(req.params[paramId]);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: "Ресурс не найден",
        });
      }

      const ownerId = resource.createdBy || resource.userId;

      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: "Доступ только для владельца ресурса",
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Ошибка проверки прав владельца",
      });
    }
  };
};

module.exports = checkOwnership;
