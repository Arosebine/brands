const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../user/models/user.model');
const Token = require('../user/models/token.model');
const { sequelize } = require("../connection/database.connection");
const sendEmail = require("../utils/sendEmail");

jest.mock('../../src/user/models/user.model');
jest.mock('../../src/user/models/token.model');
jest.mock('../../src/utils/sendEmail');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');



describe('User Sign Up', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new user successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'seun Kunle',
      phoneNumber: '09023410988',
      address: '23, oke-odo street',
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    };

    User.findOne.mockResolvedValue(null);
    Token.create.mockResolvedValue({ token: 'euy123', userId: mockUser.id });
    User.create.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/v1/user/userSignUp')
      .send(mockUser);

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      message: 'User created',
      user: { ...mockUser, password: undefined },
    });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: mockUser.email,
      subject: 'Welcome to the Great Brands app',
      message: expect.stringContaining('Please, Kindly use this OTP to verify your email'),
    }));
  });

  test('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/v1/user/userSignUp')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'name is required' });
  });

  test('should return 400 if password does not meet criteria', async () => {
    const mockUser = {
      name: 'seun kunle',
      phoneNumber: '09023410988',
      address: '23, oke-odo street',
      email: 'seunk@yopmail.com',
      password: 'seyico09',
    };

    const response = await request(app)
      .post('/api/v1/user/userSignUp')
      .send(mockUser);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      message: 'Password must contain at least one capital letter and one number and special character',
    });
  });

  test('should return 400 if user already exists', async () => {
    const mockUser = {
      name: 'seun kunle',
      phoneNumber: '09023410988',
      address: '23, oke-odo street',
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    };

    User.findOne.mockResolvedValueOnce(mockUser); // User already exists

    const response = await request(app)
      .post('/api/v1/user/userSignUp')
      .send(mockUser);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'User already exists' });
  });

  test('should return 400 if phone number already exists', async () => {
    const mockUser = {
      name: 'seun kunle',
      phoneNumber: '09023410988',
      address: '23, oke-odo street',
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    };

    User.findOne.mockResolvedValueOnce(null); // User does not exist
    User.findOne.mockResolvedValueOnce(mockUser); // Phone number already exists

    const response = await request(app)
      .post('/api/v1/user/userSignUp')
      .send(mockUser);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'Phone number already exists' });
  });

  test('should return 500 on server error', async () => {
    const mockUser = {
      name: 'seun kunle',
      phoneNumber: '09023410988',
      address: '23, oke-odo street',
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    };

    User.findOne.mockImplementation(() => {
      throw new Error('Database error');
    });

    const response = await request(app)
      .post('/api/v1/user/userSignUp')
      .send(mockUser);

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Error signing up',
      error: 'Database error',
    });
  });
});








describe('User Login', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  afterAll(() => {
    clearTimeout(global.setTimeout);
  });

  let mockUser;

  beforeEach(() => {
    mockUser = {
      id: 1,
      email: 'seunk@yopmail.com',
      password: 'hashedPassword',
      isVerified: true,
      save: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if user is not found', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/user/userLogin').send({
      email: 'nonexistent@yopmail.com',
      password: 'seyico09@',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User not found');
  });

  it('should return 400 if password is incorrect', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false); // Simulating password mismatch

    const res = await request(app).post('/api/v1/user/userLogin').send({
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(`User's incorrect credentials`);
  });

  it('should return 400 if account is not verified', async () => {
    mockUser.isVerified = false; // Simulating unverified account
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true); // Password matches

    const res = await request(app).post('/api/v1/user/userLogin').send({
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Your account is pending. kindly check your email inbox and verify it');
  });

  it('should return 200 and a token on successful login', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true); // Password matches
    jwt.sign.mockReturnValue('fakeToken'); // Mocking JWT token

    const res = await request(app).post('/api/v1/user/userLogin').send({
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User logged in successfully');
    expect(res.body.token).toBe('fakeToken');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined(); // Password should not be returned
  });

  it('should return 500 if there is a server error', async () => {
    User.findOne.mockRejectedValue(new Error('Database error'));

    const res = await request(app).post('/api/v1/user/userLogin').send({
      email: 'seunk@yopmail.com',
      password: 'Seyico09@',
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error logging in');
    expect(res.body.error).toBe('Database error');
  });
});

