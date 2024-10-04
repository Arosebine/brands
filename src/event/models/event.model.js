const { DataTypes, UUIDV4 } = require('sequelize');
const { sequelize } = require('../../connection/database.connection');
const User = require('../../user/models/user.model');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: UUIDV4(),
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalTickets: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  availableTickets: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  bookedTickets: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'Event',
  timestamps: true,
  freezeTableName: true,
});


Event.sync({force: true}).then(() => {
  console.log('Event table synced');
});

module.exports = Event;
