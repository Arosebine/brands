const { DataTypes, UUIDV4 } = require('sequelize');
const { sequelize } = require('../../connection/database.connection');
const Booking = require('../../event/models/booking.model');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: UUIDV4(),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      validatePhoneNumber: function(value) {
        if (!/^\d{11}$/.test(value)) {
          throw new Error('Invalid phone number');
        }
      },
    },
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.STRING,
    enum: ['user', 'admin'],
    defaultValue: 'user',
  },
}, {
  sequelize,
  timestamps: true,
  modelName: 'User',
  freezeTableName: true,
});

// Define associations
// User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
// Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.sync({}).then(() => {
  console.log('User table synced');
});

module.exports = User;
