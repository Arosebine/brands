const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };
  
  module.exports = errorMiddleware;
  