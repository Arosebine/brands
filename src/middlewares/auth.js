const jwt = require('jsonwebtoken');
const User = require('../../src/user/models/user.model');

exports.isAuth = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header is missing' });
    }

    // Extract token from the header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token is missing' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to the request object
    req.user = await User.findOne(decoded.id);
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    let message = 'Token verification failed';
    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    return res.status(401).json({ message, error: error.message });
  }
};
