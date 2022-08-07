//==========================================[ Imports ]=================================================>
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const validators = require("../validator/validtor");


//==========================================[ Create Cart ]=================================================>

let createCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let productId = req.body.productId

        //---------------[validations]--------------->

        //----[valid body]
        if (!validators.isValidRequestBody(req.body))
            return res.status(400).send({
                status: false,
                message:
                    "Invalid request parameter. Please provide user details in request body.",
            });
        //------[user]
        if (!validators.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid userId",
            });
        }
        let findUser = await userModel.findOne({ _id: userId });
        if (!findUser) {
            return res.status(404).send({
                status: false,
                message: "User not found",
            });
        }
        //------[product]
        if (!validators.isValidField(productId))
            return res
                .status(400)
                .send({
                    status: false, message: "ProductId is required."
                });
        if (!validators.isValidObjectId(productId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid productId",
            });
        }
        //-----[find product in db]
        let findproduct = await productModel.findOne({ _id: productId, isDeletd: false });
        if (!findproduct) {
            return res.status(404).send({
                status: false,
                message: "product not found",
            });
        }
        //------[authorization]
        let userAccessing = req.validToken.userId;
        if (userId != userAccessing) {
            return res.status(403).send({
                status: false,
                message: "User not authorised",
            });
        }
        
        //------[find cart with userId or create new cart]------>
        let findUserId = await cartModel.findOne({ userId: userId })
        if (!findUserId) {  //if cart is not present
            let newCart = { userId: userId }
            let items = []
            let product = { productId: productId, quantity: 1 }
            items.push(product)
            newCart.items = items
            newCart.totalPrice = findproduct.price
            newCart.totalItems = 1
            let create = await cartModel.create(newCart)
            return res.status(201).send({ status: true, message: 'Success', data: create })

        } else {    //if cart is present
            let itemsPresent = findUserId.items
            let i = 0
            for (i; i < itemsPresent.length; i++) {
                if (itemsPresent[i].productId == productId) {
                    itemsPresent[i].quantity++
                    break
                }
            }
            if (i == itemsPresent.length) {
                let product = { productId: productId, quantity: 1 }
                itemsPresent.push(product)
            }

            findUserId.totalItems = itemsPresent.length
            findUserId.totalPrice += findproduct.price

            await findUserId.save() //save document

            return res.status(201).send({
                status: true,                   //send response
                message: 'Success',
                data: findUserId
            })
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

//==========================================[ Update Cart ]=================================================>

let updateCart = async function (req, res) {
    try {
        let userId = req.params.userId;
        let { productId, cartId, removeProduct } = req.body

        //---------------[validations]--------------->
        if (!validators.isValidRequestBody(req.body))
            return res.status(400).send({
                status: false,
                message:
                    "Invalid request parameter. Please provide user details in request body.",
            });

        //------[product]
        if (!validators.isValidField(productId))
            return res
                .status(400)
                .send({ status: false, message: "ProductId is required." });

        if (!validators.isValidObjectId(productId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid productId",
            });
        }
        let findproduct = await productModel.findOne({ _id: productId, isDeletd: false });
        if (!findproduct) {
            return res.status(404).send({
                status: false,
                message: "product not found",
            });
        }
        //------[cart]
        if (!validators.isValidField(cartId))
            return res
                .status(400)
                .send({ status: false, message: "cartID is required." });

        if (!validators.isValidObjectId(cartId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid cartId",
            });
        }
        let findCart = await cartModel.findOne({ _id: cartId , userId: userId });
        if (!findCart) {
            return res.status(404).send({
                status: false,
                message: "cart not found",
            });
        }
        //------[user]
        if (!validators.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid userId",
            });
        }
        let findUser = await userModel.findOne({ _id: userId });
        if (!findUser) {
            return res.status(404).send({
                status: false,
                message: "User not found",
            });
        }

        if (removeProduct != 1 && removeProduct != 0) {
            return res.status(404).send({
                status: false,
                message: "Remove product is mandatory can only be 1 0r 0",
            });
        }
        //------[Authorization]
        let userAccessing = req.validToken.userId;
        if (userId != userAccessing) {
            return res.status(403).send({
                status: false,
                message: "User not authorised",
            });
        }
        //------[Updating]------>
        let item = findCart.items
        let isDecrease = false
        let i = 0
        for (i; i < item.length; i++) {
            if (item[i].productId == productId) {                           //compare Id with each product
                if (removeProduct == 1) {
                    item[i].quantity--                                      //dicrease quantity
                    findCart.totalPrice -= findproduct.price                //dicrease price
                } else {
                    let price = item[i].quantity * findproduct.price        //remove price
                    findCart.totalPrice -= price
                    item[i].quantity = 0                                    //set quantity to zero
                }
                if (item[i].quantity == 0) {   
                    item.splice(i, 1)                                       //if item quantity is zero, remove product from items
                }
                isDecrease = true     
                break;
            }
        }
        if (isDecrease == false) {          //if product is not in cart
            return res.status(400).send({ status: false, message: 'product not in cart' })
        }
        findCart.totalItems = item.length

        //------[save document]
        await findCart.save()

        return res.status(200).send({
            status: true,
            message: 'Success',
            data: findCart                  //<------[final response]------>
        })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

//==========================================[ Get Cart ]=================================================>

let getCart = async (req, res) => {
    try {
        let userId = req.params.userId

        //=========[Validations]=========>

        if (!validators.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,                              
                message: "Not a valid userId",
            });
        }
        // ===[ find user ]===
        let findUser = await userModel.findOne({ _id: userId });
        if (!findUser) {
            return res.status(404).send({
                status: false,
                message: "User not found",
            });
        }
        // ===[ Authorization ]===
        let userAccessing = req.validToken.userId;
        if (userId != userAccessing) {
            return res.status(403).send({
                status: false,
                message: "User not authorised",
            });
        }
        // ===[ find cart with userid ]===
        let findCart = await cartModel.findOne({ userId: userId }).populate({
            path: 'items.productId',
            select:
              'title price productImage style availableSizes isDeleted',
          });
        if (!findCart) {
            return res.status(404).send({
                status: false,
                message: "cart not found",
            });
        }
        // ===[ Response ]===
        return res.status(200).send({
            status: true,
            message: "Success",
            data: findCart
        })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

//==========================================[ Delete Cart ]=================================================>

let deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId
        
        //=========[Validations]=========>

        if (!validators.isValidObjectId(userId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid userId",
            });
        }
        // ===[ find user ]===
        let findUser = await userModel.findOne({ _id: userId });
        if (!findUser) {
            return res.status(404).send({
                status: false,
                message: "User not found",
            });
        }

        // ===[ Authorization ]===
        let userAccessing = req.validToken.userId;
        if (userId != userAccessing) {
            return res.status(403).send({
                status: false,
                message: "User not authorised",
            });
        }

        // ===[ find cart ]===
        let findCart = await cartModel.findOne({ userId: userId });
        if (!findCart) {
            return res.status(404).send({
                status: false,
                message: "cart not found",
            });
        }
        // ===[ Deleting cart Items ]===
        findCart.items.splice(0, findCart.items.length)
        findCart.totalPrice = 0
        findCart.totalItems = 0

        await findCart.save() //save doc

        // ===[ Response ]===
        return res.status(204).send({})
        
        
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}

//==========================================[ Exports ]=================================================>
module.exports.createCart = createCart
module.exports.updateCart = updateCart
module.exports.getCart = getCart
module.exports.deleteCart = deleteCart