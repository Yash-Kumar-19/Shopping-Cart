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

//===================( Product Apis )========================>

//              <----[Create Product]------>
router.post("/products", productController.createProduct)

//              <----[Get Product]------>
router.get("/products", productController.getProduct);

//              <----[Get By ID Product]------>
router.get("/products/:productId", productController.getProductById);

//              <----[Delete Product]------>
router.delete("/products/:productId", productController.deleteProduct)

//              <----[Update Product]------>
router.put("/products/:productId", productController.updateProducts)



//===================( Export )========================>
module.exports = router