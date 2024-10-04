const express = require('express');
const eventController = require('../controller/event.controller');
const { isAuth } = require('../../middlewares/auth');
const router = express.Router();

router.use(isAuth);
router.post('/initialize', eventController.initializeEvent);
router.post('/book/:eventId', eventController.bookTicket);
router.post('/cancel/:eventId', eventController.cancelBooking);
router.get('/status/:eventId', eventController.getEventStatus);

module.exports = router;
