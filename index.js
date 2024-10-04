require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require('morgan');


const { connectDB } = require("./src/connection/database.connection");
const logger = require("./src/utils/winston");
const userRoutes = require("./src/user/routes/user.routes");
const eventRoutes = require("./src/event/routes/event.routes");





const app = express();

connectDB();
const port = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(mongoSanitize());
app.use(helmet());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.get('/', (req, res) => {
    res.send('Hello, Great Brands!');
});

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/event', eventRoutes);



app.listen(port, () => {
    logger.info(`Great Brands Server is running on port: http://localhost:${port}`);
  });

module.exports = app;