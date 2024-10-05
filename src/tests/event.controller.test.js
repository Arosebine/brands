const request = require('supertest');
const app = require('../app');
const User = require('../../src/user/models/user.model');
const Event = require('../../src/event/models/event.model');
const Booking = require('../../src/event/models/booking.model');
const WaitingList = require('../../src/event/models/waitinglist.model');
const { sequelize } = require("../connection/database.connection");
const sendEmail = require("../utils/sendEmail");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

jest.mock('../../src/user/models/user.model');
jest.mock('../../src/event/models/event.model');
jest.mock('../../src/event/models/booking.model');
jest.mock('../../src/event/models/waitinglist.model');
jest.mock('../../src/utils/sendEmail');
jest.mock('jsonwebtoken');
jest.mock('crypto');


describe('Initialize Event', () => {
  let token;

  beforeEach(() => {
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  });

  
  afterAll(async () => {
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if user is not authorized', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'admin' });

    const res = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventName: 'Tech world',
        totalTickets: 100,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are not authorized to perform this action');
  });

  it('should return 400 if totalTickets is missing', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'admin' });

    const res = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Event total tickets are required');
  });

  it('should return 400 if totalTickets is not a positive number', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'admin' });

    const res = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', `Bearer ${token}`)
      .send({
        totalTickets: -10,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Total tickets must be a positive number');
  });

  it('should create an event and send email notification', async () => {
    const userMock = { id: 1, role: 'admin', name: 'kemi', email: 'admin@yopmail.com' };
    User.findByPk.mockResolvedValueOnce(userMock);
    
    Event.create.mockResolvedValueOnce({
      id: 1,
      userId: userMock.id,
      eventName: 'Tech world',
      name: userMock.name,
      totalTickets: 100,
      availableTickets: 100,
    });

    const res = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', `Bearer ${token}`)
      .send({
        totalTickets: 100,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Event created successfully');
    expect(res.body.event).toEqual({
      id: 1,
      userId: userMock.id,
      eventName: 'Tech world',
      name: userMock.name,
      totalTickets: 100,
      availableTickets: 100,
    });
    
    expect(sendEmail).toHaveBeenCalledWith({
      email: userMock.email,
      subject: 'Event Created',
      message: `Your event has been created successfully with ID: 1, and total tickets: 100.`,
    });
  });

  it('should return 500 on internal server error', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'admin' });
    Event.create.mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', `Bearer ${token}`)
      .send({
        totalTickets: 100,
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Something went wrong while creating the event');
    expect(res.body.error).toBe('Database error');
  });
});





describe('book a ticket', () => {
  let token;
  let transactionMock;

  beforeEach(() => {
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    transactionMock = {
      commit: jest.fn(),
      rollback: jest.fn(),
      LOCK: { UPDATE: 'LOCK UPDATE' },
    };
    sequelize.transaction = jest.fn(() => Promise.resolve(transactionMock));
  });

  
  afterAll(async () => {
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if the user is not authorized', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'user' });

    const res = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are not authorized to perform this action');
  });

  it('should return 404 if event is not found', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'user' });
    Event.findByPk.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(transactionMock.rollback).toHaveBeenCalled();
    expect(res.body.message).toBe('Event not found');
  });

  it('should add the user to the waiting list if no tickets are available', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'user' });
    Event.findByPk.mockResolvedValueOnce({
      availableTickets: 0,
    });
    WaitingList.create.mockResolvedValueOnce({ id: 1, eventId: 1, userId: 1 });

    const res = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('No tickets available, you have been added to the waiting list');
    expect(transactionMock.commit).toHaveBeenCalled();
    expect(WaitingList.create).toHaveBeenCalledWith({ eventId: 1, userId: 1 }, { transaction: transactionMock });
  });

  it('should successfully book a ticket if tickets are available', async () => {
    const userMock = { id: 1, role: 'user', email: 'user@yopmail.com' };
    const eventMock = {
      id: 1,
      availableTickets: 10,
      bookedTickets: 5,
      save: jest.fn(),
    };
    const bookingMock = { id: 1, ticketId: 'GreatBrands-1234' };

    User.findByPk.mockResolvedValueOnce(userMock);
    Event.findByPk.mockResolvedValueOnce(eventMock);
    Booking.create.mockResolvedValueOnce(bookingMock);
    crypto.randomBytes.mockReturnValueOnce(Buffer.from('12'));

    const res = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Ticket booked successfully');
    expect(res.body.book).toEqual(bookingMock);
    expect(transactionMock.commit).toHaveBeenCalled();
    expect(eventMock.availableTickets).toBe(9);
    expect(eventMock.bookedTickets).toBe(6);
    expect(eventMock.save).toHaveBeenCalledWith({ transaction: transactionMock });

    expect(sendEmail).toHaveBeenCalledWith({
      email: userMock.email,
      subject: 'Ticket Booked',
      message: `Your ticket has been booked successfully. This is your Ticket ID: ${bookingMock.ticketId}.`,
    });
  });

  it('should return 500 if there is an error while booking the ticket', async () => {
    User.findByPk.mockResolvedValueOnce({ id: 1, role: 'user' });
    Event.findByPk.mockResolvedValueOnce({
      availableTickets: 10,
      bookedTickets: 5,
      save: jest.fn(),
    });
    Booking.create.mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Something went wrong while booking the ticket');
    expect(res.body.error).toBe('Database error');
    expect(transactionMock.rollback).toHaveBeenCalled();
  });
});



describe('Cancel a ticket', () => {
  let token;
  let user;
  let event;
  let booking;
  let waitingListUser;

  beforeEach(async () => {
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    user = await User.create({ id: 1, email: 'test@yopmail.com', role: 'user', isVerified: true });
    event = await Event.create({ id: 1, userId: user.id, totalTickets: 100, availableTickets: 1, bookedTickets: 99 });
    booking = await Booking.create({ eventId: event.id, userId: user.id });
    waitingListUser = await WaitingList.create({ eventId: event.id, userId: 2 });
  });

  afterEach(async () => {
    await Booking.destroy({ where: {} });
    await WaitingList.destroy({ where: {} });
    await Event.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should cancel the booking and assign the ticket to a user on the waiting list', async () => {
    const res = await request(app)
      .post(`/api/v1/event/cancel/${event.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Ticket assigned to next user in waiting list');
  });

  it('should cancel the booking and increment available tickets when no waiting list', async () => {
    await WaitingList.destroy({ where: { eventId: event.id } });

    const res = await request(app)
      .post(`/api/v1/event/cancel/${event.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Your booking was cancelled successfully, and a ticket was made available.');
    const updatedEvent = await Event.findByPk(event.id);
    expect(updatedEvent.availableTickets).toBe(2);
  });

  it('should return 400 if the booking is not found', async () => {
    await Booking.destroy({ where: { eventId: event.id, userId: user.id } });

    const res = await request(app)
      .post(`/api/v1/event/cancel/${event.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Booking not found');
  });

  it('should return 403 if user is not authorized', async () => {
    const unauthorizedToken = jwt.sign({ id: 2 }, process.env.JWT_SECRET);

    const res = await request(app)
      .post(`/api/v1/event/cancel/${event.id}`)
      .set('Authorization', `Bearer ${unauthorizedToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are not authorized to perform this action');
  });

  it('should return 404 if the event is not found', async () => {
    const res = await request(app)
      .post('/api/v1/event/cancel/999') // Non-existent event ID
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Event not found');
  });

  it('should return 500 if there is an error during booking cancellation', async () => {
    jest.spyOn(Booking, 'findOne').mockImplementation(() => { throw new Error('Database error'); });

    const res = await request(app)
      .post(`/api/v1/event/cancel/${event.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Something went wrong while cancelling the booking');
  });
});




describe('Get all events', () => {
    
  let token;
  let user;
  let event;
  let booking;
  let waitingListUser;

  beforeEach(async () => {
    token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

    // Mock user, event, booking, and waiting list data
    user = await User.create({ id: 1, email: 'test@test.com', role: 'user', isVerified: true });
    event = await Event.create({ id: 1, userId: user.id, totalTickets: 100, availableTickets: 10, bookedTickets: 90 });
    booking = await Booking.create({ eventId: event.id, userId: user.id });
    waitingListUser = await WaitingList.create({ eventId: event.id, userId: 2 });
  });

  afterEach(async () => {
    await Booking.destroy({ where: {} });
    await WaitingList.destroy({ where: {} });
    await Event.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(30000);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return event status successfully for authorized users', async () => {
    const res = await request(app)
      .get(`/api/v1/event/status/${event.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.availableTickets).toBe(event.availableTickets);
    expect(res.body.waitingListCount).toBe(1);
    expect(res.body.bookedTickets).toBe(event.bookedTickets);
    expect(res.body.books.length).toBe(1);
  });

  it('should return 403 if the user is not authorized', async () => {
    const unauthorizedToken = jwt.sign({ id: 2 }, process.env.JWT_SECRET);

    const res = await request(app)
      .get(`/events/${event.id}/status`)
      .set('Authorization', `Bearer ${unauthorizedToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are not authorized to perform this action');
  });

  it('should return 404 if the event is not found', async () => {
    const res = await request(app)
      .get('/api/v1/event/status/99') // Non-existent event ID
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Event not found');
  });

  it('should return 500 if there is a server error', async () => {
    jest.spyOn(Event, 'findByPk').mockImplementation(() => { throw new Error('Database error'); });

    const res = await request(app)
      .get(`/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Something went wrong while fetching the event status');
  });
});
