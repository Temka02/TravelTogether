const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email обязателен"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Введите корректный email",
      ],
    },
    role: {
      type: String,
      enum: ["guest", "user", "organizer", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "Пароль обязателен"],
      minlength: [6, "Пароль должен быть не менее 6 символов"],
    },
    firstName: {
      type: String,
      required: [true, "Имя обязательно"],
      trim: true,
      maxlength: [50, "Имя не может превышать 50 символов"],
    },
    lastName: {
      type: String,
      required: [true, "Фамилия обязательна"],
      trim: true,
      maxlength: [50, "Фамилия не может превышать 50 символов"],
    },
    phone: {
      type: String,
      default: "",
      match: [
        /^(\+7|8)[0-9]{10}$/,
        "Введите корректный российский номер телефона",
      ],
    },

    tripsAsParticipant: {
      type: Number,
      default: 0,
    },
    tripsAsOrganizer: {
      type: Number,
      default: 0,
    },

    skills: [
      {
        type: String,
        default: [],
        trim: true,
      },
    ],
    mainSkills: [
      {
        type: String,
        default: [],
        trim: true,
        validate: {
          validator: function (mainSkills) {
            if (!Array.isArray(mainSkills) || mainSkills.length === 0) {
              return true;
            }

            if (!Array.isArray(this.skills)) {
              return false;
            }

            return mainSkills.every((skill) =>
              this.skills.some(
                (s) => String(s).trim() === String(skill).trim(),
              ),
            );
          },
          message: "Основные навыки должны быть из списка ваших навыков",
        },
      },
    ],

    allergies: [
      {
        type: String,
        default: [],
        trim: true,
      },
    ],
    medicalConditions: [
      {
        type: String,
        default: [],
        trim: true,
      },
    ],
    dietaryRestrictions: [
      {
        type: String,
        default: [],
        trim: true,
      },
    ],

    aboutMe: {
      type: String,
      default: "",
      maxlength: [500, "Описание не может превышать 500 символов"],
    },

    avatarKey: {
      type: String,
      default: "",
    },

    organizedTrips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
      },
    ],
    joinedTrips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.path("mainSkills").validate(function (mainSkills) {
  return mainSkills.length <= 3;
}, "Нельзя выбрать больше 3 основных навыков");

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// pre-save хук для хеширования пароля
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Хеширование пароля
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
module.exports = mongoose.model("User", userSchema);
