//==========================================[ Imports ]=================================================>
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')
const validators = require("../validator/validtor");
const orderModel = require('../models/orderModel');

//==========================================[ Create Order ]=================================================>
let createOrder = async (req, res) => {
    try {
        let userId = req.params.userId
        let { cartId, cancellable } = req.body

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
        let findCart = await cartModel.findOne({ _id: cartId, userId: userId }).select({ __v: 0, updatedAt: 0, createdAt: 0 });
        if (!findCart) {
            return res.status(404).send({
                status: false,
                message: "cart not found",
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
        //------[create]-----
        let items = findCart.items
        if(items.length ==0){
            return res.status(404).send({status: false, message: "No items found in cart"})
        }
        let totalQuantity = 0
        for (let item of items) {
            totalQuantity += item.quantity
        }
        cancellable = true
        if ('cancellable' in req.body) {
            if (cancellable !== true && cancellable !== false) {
                return res.status(400).send({ status: false, message: 'cancellable can only be true or false' })
            } else {
                cancellable = req.body.cancellable
            }
        }
        //-----[ Create response ]
        let order = {
            items: findCart.items,
            userId: userId,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity,
            cancellable
        }
        let create = await orderModel.create(order)

        //------[ Cart Empty ]
        findCart.items.splice(0, findCart.items.length)
        findCart.totalPrice = 0
        findCart.totalItems = 0
        await findCart.save()

        //------[send response]-----
        return res.status(201).send({
            status: true,
            message: 'Success',
            data: create
        })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message }); 
    }

}


//==========================================[ Update Order ]=================================================>

let updateOrder = async function (req, res) {
    try {

        let userId = req.params.userId
        let { orderId, status } = req.body

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
        //------[Authorization]
        let userAccessing = req.validToken.userId;
        if (userId != userAccessing) {
            return res.status(403).send({
                status: false,
                message: "User not authorised",
            });
        }

        //------[OrderId]
        if (!validators.isValidField(orderId))
            return res
                .status(400)
                .send({ status: false, message: "orderID is required." });

        if (!validators.isValidObjectId(orderId)) {
            return res.status(400).send({
                status: false,
                message: "Not a valid orderId",
            });
        }
        let findOrder = await orderModel.findOne({ _id: orderId, userId: userId });
        if (!findOrder) {
            return res.status(404).send({
                status: false,
                message: "Order not found",
            });
        }


        if (findOrder.status !== 'pending') {
            return res.status(400).send({
                status: false, message: `Order is already ${findOrder.status}`
            })
        }


        if (status != 'pending' && status != 'canceled' && status != 'completed') {
            return res.status(400).send({
                status: false,
                message: "Status can only be pending , completed or canceled",
            })
        }
        if (status == 'canceled') {
            if (findOrder.canceled === true) {
                findOrder.status = 'canceled'
            } else {
                return res.status(400).send({
                    status: false,
                    message: "there is no option for cancelation",
                })
            }
        } else {
            findOrder.status = status
        }
        await findOrder.save()

        return res.status(200).send({
            status: true,
            message: "Success",
            data: findOrder
        })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//==========================================[ Export ]===========================>
module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder


