const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название поездки обязательно'],
    trim: true,
    maxlength: 100
  },
  destination: {
    type: String,
    required: [true, 'Направление обязательно'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Описание обязательно'],
    maxlength: 1000
  },
  startDate: {
    type: Date,
    required: [true, 'Дата начала обязательна']
  },
  endDate: {
    type: Date,
    required: [true, 'Дата окончания обязательна']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  price: {
    type: Number,
    required: [true, 'Цена обязательна'],
    min: 0
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, 
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['planning', "active", 'completed'],
    default: 'planning'
  }
}, {
  timestamps: true
});

tripSchema.virtual('currentParticipants').get(function() {
  return this.participants ? this.participants.length : 0;
});

tripSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

tripSchema.virtual('availableSpots').get(function() {
  if (!this.maxParticipants) return 0;
  return this.maxParticipants - (this.participants ? this.participants.length : 0);
});

tripSchema.set('toJSON', { virtuals: true });

tripSchema.methods.updateStatus = function() {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'planning';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active'; 
  } else if (now > this.endDate) {
    this.status = 'completed';
  }
};

module.exports = mongoose.model('Trip', tripSchema);