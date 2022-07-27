// <<========================[ Import ]===========================>>
const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController')
const productController = require("../controllers/productController")
const auth = require('../middleware/auth')


// <<========================[ ALL APIs ]===========================>>

//===================( User Apis )========================>

//              <----[Create User]------>
router.post("/register", userController.createUser)

//              <----[Login User]------>
router.post("/login", userController.userLogin)
//router.get('/user/:userId/profile',middleware.authentication,middleware.authorisation, userController.getUserProfile)

//              <------[Get User]------>
router.get("/user/:userId/profile", auth.authentication, userController.getUser)

//              <----[Update User]------>
router.put("/user/:userId/profile", auth.authentication, userController.updateUser)


router.post("/products", productController.createProduct)
router.get("/products/:productId", productController.getProductById);
router.delete("/products/:productId", productController.deleteProduct)



//===================( Export )========================>
module.exports = router