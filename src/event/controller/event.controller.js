const Event = require ('../models/event.model');
const Booking = require('../models/booking.model');
const User = require('../../user/models/user.model');
const { sequelize } = require('../../connection/database.connection');
const WaitingList = require('../models/waitinglist.model');

// Initialize event
exports.initializeEvent = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findByPk(id);

    // Ensure the user is an admin
    if (!user || (user.role !== "user" && user.role !== "admin")) {
      return res.status(403).json({ message: 'You are not authorized to perform this action' });
    }

    // Validate request body
    const { totalTickets } = req.body;
    if (!totalTickets) {
      return res.status(400).json({ message: 'Event total tickets are required' });
    }
    
    if (isNaN(totalTickets) || totalTickets <= 0) {
      return res.status(400).json({ message: 'Total tickets must be a positive number' });
    }

    // Create a new event
    const event = await Event.create({
      userId: user.id,
      name: user.name,
      totalTickets,
      availableTickets: totalTickets,
    });

    return res.status(201).json({ message: 'Event created successfully', event });

  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong while creating the event', error: error.message });
  }
};


// Book a ticket
exports.bookTicket = async (req, res) => {
  let transaction;
  try {
    const { id } = req.user;
    const user = await User.findByPk(id);

    if (!user || user.role !== "user") {
      return res.status(403).json({ message: 'You are not authorized to perform this action' });
    }

    transaction = await sequelize.transaction();

    const { eventId } = req.params;

    const event = await Event.findByPk(eventId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if tickets are available and if not add user to waiting list
    if (event.availableTickets <= 0) {
      const waitingList = await WaitingList.create({ eventId, userId: user.id }, { transaction });
      await waitingList.save({ transaction });

      await transaction.commit();
      return res.status(200).json({ message: 'No tickets available, you have been added to the waiting list', waitingList });
    }

    // Book ticket by creating a new booking and reducing available tickets
    const book = await Booking.create({ eventId, userId: user.id }, { transaction });
    event.availableTickets -= 1;
    event.bookedTickets += 1;
    await event.save({ transaction });

    await transaction.commit();
    return res.status(200).json({ message: 'Ticket booked successfully', event, book });
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res.status(500).json({
      message: 'Something went wrong while booking the ticket',
      error: error.message,
    });
  }
};



// Cancel booking
exports.cancelBooking = async (req, res) => {
  let transaction;
  try {
    const { id } = req.user;
    const user = await User.findByPk(id);
    
    if (!user || user.role !== "user") {
      return res.status(403).json({ message: 'You are not authorized to perform this action' });
    }

    const { eventId } = req.params;

    const booking = await Booking.findOne({ where: { eventId, userId: user.id } });

    if (!booking) {
      return res.status(400).json({ message: 'Booking not found' });
    }

    // Start transaction
    transaction = await sequelize.transaction();

    // Cancel booking
    await booking.destroy({ transaction });
    
    // Update the event's available tickets and check the waiting list
    const event = await Event.findByPk(eventId, { transaction });
    
    if (!event) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Event not found' });
    }

    // Handle waiting list logic
    const waitingList = await WaitingList.findAll({ where: { eventId }, transaction });
    let nextUser = null;
    if (waitingList && waitingList.length > 0) {
      nextUser = waitingList.shift(); // Remove the first entry (FIFO)
      await Booking.create({
        eventId,
        userId: nextUser.userId,
      }, { transaction });
    } else {
      event.availableTickets += 1;
      event.bookedTickets -= 1;
    }

    await WaitingList.destroy({ where: { eventId }, transaction });
    await event.save({ transaction });

    await transaction.commit();

    return res.status(200).json({
      message: nextUser
        ? `Your booking was cancelled. Ticket assigned to next user in waiting list (User ID: ${nextUser.userId}).`
        : 'Your booking was cancelled successfully, and a ticket was made available.',
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res.status(500).json({
      message: 'Something went wrong while cancelling the booking',
      error: error.message,
    });
  }
};


// Get event status
exports.getEventStatus = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findByPk(id);
    
    if (!user || (user.role !== "user" && user.role !== "admin")) {
      return res.status(403).json({ message: 'You are not authorized to perform this action' });
    }

    const { eventId } = req.params;
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get the count of users in the waiting list
    const waitingListCount = await WaitingList.count({ where: { eventId } });
    const books = await Booking.findAll({ where: { eventId } });

    return res.status(200).json({
      availableTickets: event.availableTickets,
      waitingListCount,
      bookedTickets: event.bookedTickets,
      books,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong while fetching the event status',
      error: error.message,
    });
  }
};
