const User = require("../models/user.model");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
const Token = require("../models/token.model");



exports.userSignUp = async (req, res) => {
  try {
    const { name, phoneNumber, address, email, password } = req.body;
    const userInput = {name, phoneNumber, address, email, password}
    for (const key in userInput) {
      if (!userInput[key]) {
        return res.status(400).json({
          message: `${key} is required`
        });
      }
    }

    if (!password.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/) || !password.match(/[a-zA-Z]/)) {
        return res.status(400).json({
        message: 'Password must contain at least one capital letter and one number and special character'
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const existingUser = await User.findOne({ where: { email } });
    if(existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }
    const phoneNumberExist = await User.findOne({ where: {phoneNumber } });
    if(phoneNumberExist){
        return res.status(400).json({
            message: 'Phone number already exists'
        })
    }
    const newUser = await User.create({
      name,
      phoneNumber,
      address,
      email,
      password: hashedPassword
      
    });
    const otp = Math.floor(1000 + Math.random() * 9000);
    const token = await Token.create({
      token: otp,
      userId: newUser.id
    });

    await sendEmail({
      email: newUser.email,
      subject: 'Welcome to the Great Brands app',
      message: `Hi ${newUser.name},
                     Please, Kindly use this OTP to verify your email,
                     OTP: ${token.token}
                     `
    });
    newUser.password = undefined
    return res.status(201).json({
      message: 'User created',
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error signing up',
      error: error.message
    });
  }
}

// to verify user email
exports.verifyEmail = async (req, res) => {
    try {
        const otp = req.params.otp;
        const token = await Token.findOne({ where: { token: otp } });

        if (!token) {
            return res.status(400).json({
                message: 'Token is not valid or has expired'
            });
        }

        const user = await User.findOne({ where: { id: token.userId } });
        if (user.isVerified) {
            return res.status(400).json({
                message: 'Your account is already verified, you can log in'
            });
        }

        await User.update(
            { isVerified: true },
            { where: { id: user.id } }
        );

        await Token.destroy({ where: { id: token.id } });

        await sendEmail({
            email: user.email,
            subject: 'Your account has been verified',
            message: `
                <p>Hi ${user.name},</p>
                <p>Your account has been successfully verified. You can now log in using your email: ${user.email}</p>
                <br><br>
                <p>Thanks,</p>
                <p>Team ${process.env.APP_NAME}</p>
            `
        });
        user.password = undefined
        return res.status(200).json({
            message: 'User verified successfully',
            user: user
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Error verifying user',
            error: error.message
        });
    }
};


// user login
exports.userLogin = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({where: { email }});
        if (!user) {
            return res.status(400).json({
                message: 'User not found'
            });
        };
        // verify password by bcrypt 
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: `User's incorrect credentials`
            });
        };
        const isActive = await User.findOne({ where: {id: user.id }});
        if (isActive.isVerified === false) {
            return res.status(400).json({
                message: 'Your account is pending. kindly check your email inbox and verify it'
            });
        };
        const token = jwt.sign({
             _id: user._id,
            }, process.env.JWT_SECRET, { expiresIn: '24h' });
            user.password = undefined
        return res.status(200).json({
            message: 'User logged in successfully',
            token,
            user
        });
    } catch (error) {
       return res.status(500).json({
            message: 'Error logging in',
            error: error.message
        });
    }
};

// forgot password

exports.forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ where: {email }});
        if (existingUser) {
          const tokens = crypto.randomBytes(3).toString('hex');
          const token = await Token.create({
             token: tokens,
             userId: existingUser.id,
        });
        await sendEmail({
            email: existingUser.email,
            subject: 'Reset your password',
            message: `
                <p>Hi ${existingUser.name},</p>
                <p> You have requested to reset your password. Below are your details</p>
                <p> ${existingUser.email} </a><br><br><br>
                <p> Your password reset token is ${tokens} </p><br><br>
                <a href="${process.env.CLIENT_URL}/resetpassword?=${token.token}">Reset Password</a>
                <p>Thanks,</p>
                <p>Team ${process.env.APP_NAME}</p>`
        });
        return res.status(200).json({
            message: 'Password reset link sent to your email',
        });
      }else{
        return res.status(400).json({
            message: 'User with this email, not found'
        });
      }
    } catch (error) {
        return res.status(400).json({
            message: 'Error while sending password reset link',
            error: error.message
        });
    }
};


// reset password

exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!password) {
            return res.status(400).json({
                message: 'Password cannot be empty'
            });
        }

        const tokenRecord = await Token.findOne({ where: { token } });

        if (tokenRecord) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const [updated] = await User.update(
                { password: hashedPassword },
                { where: { id: tokenRecord.userId }, returning: true }
            );

            if (updated) {
                await Token.destroy({ where: { token } });

                return res.status(200).json({
                    message: 'Password reset successfully'
                });
            } else {
                return res.status(400).json({
                    message: 'Failed to reset password, user not found'
                });
            }
        } else {
            return res.status(400).json({
                message: 'Token not valid'
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Error while resetting password',
            error: error.message
        });
    }
};


