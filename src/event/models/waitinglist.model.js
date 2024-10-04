const { DataTypes, UUIDV4 } = require('sequelize');
const { sequelize } = require('../../connection/database.connection');
const User = require('../../user/models/user.model');

const WaitingList = sequelize.define('WaitingList', {
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
    defaultValue: 1
    },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
      },
    },
},
    {
    sequelize,
    timestamps: true,
    modelName: 'WaitingList',
    freezeTableName: true,
    }
    );

    WaitingList.sync({}).then(() => {
    console.log('WaitingList table synced');
    });

    module.exports = WaitingList;
    