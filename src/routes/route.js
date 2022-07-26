const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController')
const auth = require('../middleware/auth')

router.post("/register", userController.createUser)
router.post("/login", userController.userLogin)
router.get("/user/:userId/profile",auth.authentication, userController.getUser)
router.put("/user/:userId/profile",auth.authentication, userController.updateUser)


module.exports = router