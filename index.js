const app = require("./src/app");


const logger = require("./src/utils/winston");


const port = process.env.PORT || 5000;



app.listen(port, () => {
    logger.info(`Great Brands Server is running on port: http://localhost:${port}`);
  });