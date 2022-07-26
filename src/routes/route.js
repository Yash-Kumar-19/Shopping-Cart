// <<========================[ Import ]===========================>>
const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController')
const auth = require('../middleware/auth')


// <<========================[ ALL APIs ]===========================>>

//===================( User Apis )========================>

//              <----[Create User]------>
router.post("/register", userController.createUser)

//              <----[Login User]------>
router.post("/login", userController.userLogin)

//              <------[Get User]------>
router.get("/user/:userId/profile",auth.authentication, userController.getUser)

//              <----[Update User]------>
router.put("/user/:userId/profile",auth.authentication, userController.updateUser)






//===================( Export )========================>
module.exports = router