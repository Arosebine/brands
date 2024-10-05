const { DataTypes, UUIDV4 } = require('sequelize');
const { sequelize } = require('../../connection/database.connection');
const User = require('../../user/models/user.model');
const Event = require('../../event/models/event.model');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: UUIDV4(),
    allowNull: false,
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numberOfTickets: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'booked',
  },
  ticketId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id',
    },
  },
}, {
  sequelize,
  timestamps: true,
  modelName: 'Booking',
  freezeTableName: true,
});


Booking.sync({}).then(() => {
  console.log('Booking table synced');
});

module.exports = Booking;

