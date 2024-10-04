const { Sequelize }= require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    port: process.env.DB_PORT,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
      underscoredAll: true
    }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Great Brands Database Connected Successfully");
  } catch (error) {
    console.log("Unable to connect to the Great Brands database:", error.message);
  }
};



module.exports = { sequelize, connectDB };