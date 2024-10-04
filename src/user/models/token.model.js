const { DataTypes, UUIDV4 } = require('sequelize');
const { sequelize } = require('../../connection/database.connection');

const Token = sequelize.define('Token', {
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
},
{
    sequelize,
    timestamps: false,
    tableName: 'Token',
    freezeTableName: true,
    indexes: [
        {
            unique: true,
            fields: ['token'],
        },
    ]

});

Token.sync({}).then(() => {
    console.log('Token table synced');
  });

module.exports = Token;
