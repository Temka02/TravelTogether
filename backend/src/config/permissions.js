const PERMISSIONS = {
  "trip:read": ["guest", "user", "organizer", "admin"],
  "trip:create": ["user", "organizer", "admin"],
  "trip:update": ["organizer", "admin"],
  "trip:delete": ["organizer", "admin"],

  "application:create": ["user", "organizer", "admin"],
  "application:read:own": ["user", "organizer", "admin"],
  "application:read:as-organizer": ["organizer", "admin", "user"],
  "application:accept": ["organizer", "admin"],
  "application:reject": ["organizer", "admin"],
  "application:delete": ["user", "organizer", "admin"],

  "user:read:own": ["user", "organizer", "admin"],
  "user:update:own": ["user", "organizer", "admin"],
  "user:read:all": ["admin"],
  "user:update:any": ["admin"],
  "user:delete": ["admin"],

  "role:manage": ["admin"],
};

const ROLES = {
  GUEST: "guest",
  USER: "user",
  ORGANIZER: "organizer",
  ADMIN: "admin",
};

module.exports = { PERMISSIONS, ROLES };
