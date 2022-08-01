// <<========================[ Import ]===========================>>
const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController')
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const auth = require('../middleware/auth')


//===================( User Apis )========================>
router.post("/register", userController.createUser)
router.post("/login", userController.userLogin)
router.get("/user/:userId/profile", auth.authentication, userController.getUser)
router.put("/user/:userId/profile", auth.authentication, userController.updateUser)

//===================( Product Apis )========================>
router.post("/products", productController.createProduct)
router.get("/products", productController.getProduct);
router.get("/products/:productId", productController.getProductById);
router.delete("/products/:productId", productController.deleteProduct)
router.put("/products/:productId", productController.updateProducts)

//===================( Product Apis )========================>
router.post("/users/:userId/cart",auth.authentication, cartController.createCart )
router.put("/users/:userId/cart",auth.authentication, cartController.updateCart )
router.get("/users/:userId/cart",auth.authentication, cartController.getCart )
router.delete("/users/:userId/cart",auth.authentication, cartController.deleteCart )

 

//===================( Export )========================>
module.exports = router