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
jest.setTimeout(10000)
jest.spyOn(console, 'log').mockImplementation(() => {});





describe('Event Initialization', () => {
  afterAll(async () => {
    await sequelize.transaction.rollback();
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create an event successfully if user is an admin', async () => {
    const mockUser = { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' };
    const mockEvent = {
      id: 1,
      eventName: 'Test Event',
      totalTickets: 100,
      availableTickets: 100,
      userId: mockUser.id,
    };

    User.findByPk.mockResolvedValue(mockUser);
    Event.create.mockResolvedValue(mockEvent);

    const response = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', 'Bearer validToken')
      .send({
        totalTickets: 100,
        eventName: 'Test Event',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      message: 'Event created successfully',
      event: mockEvent,
    });

    expect(Event.create).toHaveBeenCalledWith({
      userId: mockUser.id,
      eventName: 'Test Event',
      name: mockUser.name,
      totalTickets: 100,
      availableTickets: 100,
    });

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: mockUser.email,
      subject: 'Event Created',
      message: `Your event has been created successfully with ID: ${mockEvent.id}, and total tickets: 100.`,
    }));
  });

  test('should return 403 if user is not an admin', async () => {
    const mockUser = { id: 1, name: 'Seyi Ebine', email: 'seyi@example.com', role: 'user' };
    User.findByPk.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', 'Bearer validToken')
      .send({
        totalTickets: 100,
        eventName: 'Test Event',
      });

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      message: 'You are not authorized to perform this action but admin only',
    });
  });

  test('should return 400 if totalTickets is not provided', async () => {
    const mockUser = { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' };
    User.findByPk.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', 'Bearer validToken')
      .send({
        eventName: 'Test Event',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      message: 'Event total tickets are required',
    });
  });

  test('should return 400 if totalTickets is not a positive number', async () => {
    const mockUser = { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' };
    User.findByPk.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', 'Bearer validToken')
      .send({
        totalTickets: -100,
        eventName: 'Test Event',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      message: 'Total tickets must be a positive number',
    });
  });

  test('should return 500 if event creation fails', async () => {
    const mockUser = { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' };
    User.findByPk.mockResolvedValue(mockUser);
    Event.create.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/v1/event/initialize')
      .set('Authorization', 'Bearer validToken')
      .send({
        totalTickets: 100,
        eventName: 'Test Event',
      });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Something went wrong while creating the event',
      error: 'Database error',
    });
  });
});


describe('Ticket Booking', () => {
  afterAll(async () => {
    await sequelize.transaction.rollback();
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should book a ticket successfully if tickets are available', async () => {
    const mockUser = { id: 1, name: 'Seyi Ebine', email: 'seyi@example.com', role: 'user' };
    const mockEvent = { id: 1, eventName: 'Test Event', availableTickets: 10, bookedTickets: 0 };
    const mockBooking = { eventId: mockEvent.id, userId: mockUser.id, ticketId: 'GreatBrands-abc123' };

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockResolvedValue(mockEvent);
    Booking.create.mockResolvedValue(mockBooking);
    crypto.randomBytes.mockReturnValue(Buffer.from('abc123'));

    const response = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: 'Ticket booked successfully',
      event: { ...mockEvent, availableTickets: 9, bookedTickets: 1 },
      book: mockBooking,
    });

    expect(Event.findByPk).toHaveBeenCalledWith(1, expect.anything()); 
    expect(Booking.create).toHaveBeenCalledWith(expect.objectContaining({
      eventId: mockEvent.id,
      userId: mockUser.id,
      ticketId: 'GreatBrands-abc123',
    }), expect.anything());

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: mockUser.email,
      subject: 'Ticket Booked',
      message: expect.stringContaining('This is your Ticket ID: GreatBrands-abc123.'),
    }));
  });

  test('should add user to waiting list if no tickets are available', async () => {
    const mockUser = { id: 1, name: 'Seyi Ebine', email: 'seyi@example.com', role: 'user' };
    const mockEvent = { id: 1, eventName: 'Test Event', availableTickets: 0 };
    const mockWaitingList = { eventId: mockEvent.id, userId: mockUser.id };

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockResolvedValue(mockEvent);
    WaitingList.create.mockResolvedValue(mockWaitingList);

    const response = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: 'No tickets available, you have been added to the waiting list',
      waitingList: mockWaitingList,
    });

    expect(WaitingList.create).toHaveBeenCalledWith({ eventId: mockEvent.id, userId: mockUser.id }, expect.anything());
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('should return 403 if user is not authorized', async () => {
    const mockUser = { id: 1, name: 'Seyi Ebine', email: 'seyi@example.com', role: 'admin' };

    User.findByPk.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      message: 'You are not authorized to perform this action',
    });
  });

  test('should return 404 if event is not found', async () => {
    const mockUser = { id: 1, name: 'Seyi Ebine', email: 'seyi@example.com', role: 'user' };

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      message: 'Event not found',
    });
  });

  test('should return 500 if there is a server error', async () => {
    const mockUser = { id: 1, name: 'Seyi Ebine', email: 'seyi@example.com', role: 'user' };

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/v1/event/book/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Something went wrong while booking the ticket',
      error: 'Database error',
    });
  });
});



describe('Cancel Booking', () => {
  afterAll(async () => {
    await sequelize.transaction.rollback();
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should cancel a booking and assign a ticket to the next user in the waiting list', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'user' };
    const mockEvent = { id: 1, eventName: 'Test Event', availableTickets: 0, bookedTickets: 100 };
    const mockBooking = { eventId: mockEvent.id, userId: mockUser.id };
    const mockWaitingList = [{ userId: 2 }];

    User.findByPk.mockResolvedValue(mockUser);
    Booking.findOne.mockResolvedValue(mockBooking);
    Event.findByPk.mockResolvedValue(mockEvent);
    WaitingList.findAll.mockResolvedValue(mockWaitingList);
    Booking.create.mockResolvedValue({ eventId: mockEvent.id, userId: 2, ticketId: 'GreatBrands-abc123' });
    crypto.randomBytes.mockReturnValue(Buffer.from('abc123'));

    const response = await request(app)
      .delete('/api/v1/event/cancel/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: 'Your booking was cancelled. Ticket assigned to next user in waiting list. Sadly, not seeing you participating in this event.',
    });

    expect(Booking.findOne).toHaveBeenCalledWith({ where: { eventId: 1, userId: mockUser.id } });
    expect(Booking.create).toHaveBeenCalledWith(expect.objectContaining({
      eventId: mockEvent.id,
      userId: 2,
      ticketId: 'GreatBrands-abc123',
    }), expect.anything());

    expect(WaitingList.findAll).toHaveBeenCalledWith({ where: { eventId: 1 }, transaction: expect.anything() });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: mockUser.email,
      subject: 'Booking Cancelled',
      message: expect.stringContaining('Your booking has been cancelled successfully.'),
    }));
  });

  test('should cancel booking and make a ticket available when no one is in the waiting list', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'user' };
    const mockEvent = { id: 1, eventName: 'Test Event', availableTickets: 0, bookedTickets: 100 };
    const mockBooking = { eventId: mockEvent.id, userId: mockUser.id };

    User.findByPk.mockResolvedValue(mockUser);
    Booking.findOne.mockResolvedValue(mockBooking);
    Event.findByPk.mockResolvedValue(mockEvent);
    WaitingList.findAll.mockResolvedValue([]);

    const response = await request(app)
      .delete('/api/v1/event/cancel/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: 'Your booking was cancelled successfully, and a ticket was made available.',
    });

    expect(Event.findByPk).toHaveBeenCalledWith(1, expect.anything());
    expect(Booking.findOne).toHaveBeenCalledWith({ where: { eventId: 1, userId: mockUser.id } });
    expect(WaitingList.findAll).toHaveBeenCalledWith({ where: { eventId: 1 }, transaction: expect.anything() });

    expect(mockEvent.availableTickets).toBe(1);
    expect(mockEvent.bookedTickets).toBe(99);
  });

  test('should return 403 if user is not authorized', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'admin' };

    User.findByPk.mockResolvedValue(mockUser);

    const response = await request(app)
      .delete('/api/v1/event/cancel/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      message: 'You are not authorized to perform this action',
    });
  });

  test('should return 400 if booking is not found', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'user' };

    User.findByPk.mockResolvedValue(mockUser);
    Booking.findOne.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/v1/event/cancel/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      message: 'Booking not found',
    });
  });

  test('should return 404 if event is not found', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'user' };
    const mockBooking = { eventId: 1, userId: mockUser.id };

    User.findByPk.mockResolvedValue(mockUser);
    Booking.findOne.mockResolvedValue(mockBooking);
    Event.findByPk.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/v1/event/cancel/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      message: 'Event not found',
    });
  });

  test('should return 500 if there is a server error', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'user' };
    const mockBooking = { eventId: 1, userId: mockUser.id };

    User.findByPk.mockResolvedValue(mockUser);
    Booking.findOne.mockResolvedValue(mockBooking);
    Event.findByPk.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .delete('/api/v1/event/cancel/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Something went wrong while cancelling the booking',
      error: 'Database error',
    });
  });
});



describe('Get Event Status', () => {

  afterAll(async () => {
    clearTimeout(global.setTimeout);
    await sequelize.close();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return event status successfully if user is an admin', async () => {
    const mockUser = { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin' };
    const mockEvent = { id: 1, eventName: 'Test Event', availableTickets: 50, bookedTickets: 50 };
    const mockBookings = [{ id: 1, eventId: 1, userId: 2 }, { id: 2, eventId: 1, userId: 3 }];
    const mockWaitingListCount = 2;

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockResolvedValue(mockEvent);
    Booking.findAll.mockResolvedValue(mockBookings);
    WaitingList.count.mockResolvedValue(mockWaitingListCount);

    const response = await request(app)
      .get('/api/v1/event/status/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      availableTickets: mockEvent.availableTickets,
      waitingListCount: mockWaitingListCount,
      bookedTickets: mockEvent.bookedTickets,
      books: mockBookings,
    });

    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(Event.findByPk).toHaveBeenCalledWith(1);
    expect(Booking.findAll).toHaveBeenCalledWith({ where: { eventId: 1 } });
    expect(WaitingList.count).toHaveBeenCalledWith({ where: { eventId: 1 } });
  });

  test('should return 403 if user is not an admin', async () => {
    const mockUser = { id: 1, name: 'Kemi Seyi', email: 'kemi@example.com', role: 'user' }; 

    User.findByPk.mockResolvedValue(mockUser);

    const response = await request(app)
      .get('/api/v1/event/status/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      message: 'You are not authorized to perform this action but only admin can perform this action',
    });

    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(Event.findByPk).not.toHaveBeenCalled();
    expect(Booking.findAll).not.toHaveBeenCalled();
    expect(WaitingList.count).not.toHaveBeenCalled();
  });

  test('should return 404 if event is not found', async () => {
    const mockUser = { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin' };

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/v1/event/status/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      message: 'Event not found',
    });

    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(Event.findByPk).toHaveBeenCalledWith(1);
    expect(Booking.findAll).not.toHaveBeenCalled();
    expect(WaitingList.count).not.toHaveBeenCalled();
  });

  test('should return 500 if there is a server error', async () => {
    const mockUser = { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin' };

    User.findByPk.mockResolvedValue(mockUser);
    Event.findByPk.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/api/v1/event/status/1')
      .set('Authorization', 'Bearer validToken');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Something went wrong while fetching the event status',
      error: 'Database error',
    });

    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(Event.findByPk).toHaveBeenCalledWith(1);
  });
});