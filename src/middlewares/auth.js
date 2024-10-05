const jwt = require('jsonwebtoken');
const User = require('../../src/user/models/user.model');

exports.isAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Authorization header or token is missing' });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    handleError(error, res);
  }
};


const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};


const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const handleError = (error, res) => {
  const defaultMessage = 'Token verification failed';
  const errorMessage = error.name === 'TokenExpiredError'
    ? 'Token expired'
    : error.name === 'JsonWebTokenError'
      ? 'Invalid token'
      : defaultMessage;

  res.status(401).json({ message: errorMessage, error: error.message });
};
