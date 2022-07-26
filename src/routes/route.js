const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController')
const middleware = require('../middleware/auth')
router.post("/register", userController.createUser)
router.post("/login", userController.userLogin)
router.get('/user/:userId/profile',middleware.authentication,middleware.authorisation, userController.getUserProfile)


module.exports = router