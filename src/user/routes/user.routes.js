const express = require('express');
const router = express.Router();
const userController = require("../controller/user.controller");


router.post("/userSignUp", userController.userSignUp );
router.post("/userLogin", userController.userLogin);
router.put("/verifyEmail/:otp", userController.verifyEmail);


module.exports = router;