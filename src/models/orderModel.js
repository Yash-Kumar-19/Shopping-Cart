const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId  

const orderSchema = mongoose.Schema(
    {
        userId: { type: ObjectId, requierd: true},
        items: [{
            _id: false,
            productId: { type: ObjectId, requierd: true, _id: false },
            quantity: { type: Number, requierd: true, min: 1, }
        }],
        totalPrice: { type: Number, required: true },
        totalItems: { type: Number, required: true },
        totalQuantity: {type: Number, required: true },
        cancellable: { type: Boolean, default: true },
        status: { type:String, default: 'pending', enum:['pending', 'completed', 'canceled'] },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date } 

    }, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema)