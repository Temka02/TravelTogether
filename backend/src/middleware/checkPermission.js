const { PERMISSIONS, ROLES } = require("../config/permissions");

const checkPermission = (permission) => {
  return (req, res, next) => {
    let role = req.user ? req.user.role : ROLES.GUEST;

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      return res.status(403).json({
        success: false,
        error: "Неопределённое разрешение",
        permission,
      });
    }

    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Недостаточно прав для выполнения этой операции",
      requiredPermission: permission,
      yourRole: role,
    });
  };
};

module.exports = checkPermission;
