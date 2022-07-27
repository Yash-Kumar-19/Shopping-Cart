const productModel = require("../models/productModel")
const validators = require("../validator/validtor");
const aws = require("../aws/awsS3");
const { isValidObjectId } = require("mongoose");

const createProduct = async (req, res) => {
    try {
        let data = req.body;
        let productImage = req.files[0];
        console.log(data);

        if (!validators.isValidRequestBody(req.body))
            return res.status(400).send({
                status: false,
                message:
                    "Invalid request parameter. Please provide user details in request body.",
            });


        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (!validators.isValidField(title))
            return res
                .status(400)
                .send({ status: false, message: "title is required." });
        let alreadyTitle = await productModel.findOne({ title })
        if (alreadyTitle) return res.status(400).send({ status: false, message: `Title Already used is ${title}` })

        if (!validators.isValidField(description))
            return res
                .status(400)
                .send({ status: false, message: "description is required." });

        if (!validators.isValidField(price))
            return res
                .status(400)
                .send({ status: false, message: "price is required." });

        if (!price.match(/^[0-9.]+$/)) {
            return res.status(400).send({
                status: false,
                message: "Price should contain Numberic values.",
            });
        }

        if (!validators.isValidField(currencyId))
            return res
                .status(400)
                .send({ status: false, message: "currencyId is required." });

        if (currencyId != 'INR') {
            return res.status(400).send({
                status: false,
                message: "currencyId can be only INR.",
            });
        }

        data.currencyFormat = "₹"

        if (!validators.isValidField(availableSizes))
            return res.status(400).send({ status: false, message: "availableSizes is required." });

        if (validators.isValidField(availableSizes)) {
            let temp = availableSizes;

            if (typeof availableSizes == "object") data.availableSizes = temp;
            else data.availableSizes = temp.split(",").map(String);
        }

        for (let i of data.availableSizes) {
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]

            if (arr.indexOf(i) == -1) {
                return res.status(400).send({
                    status: false,
                    message: `Sizes can only be from  ${arr}`
                })
            }
        }

        if ("style" in data) {

            if (!validators.isValidField(style))
                return res
                    .status(400)
                    .send({ status: false, message: "style can not be empty." });

        }

        if ("installments" in data) {

            if (!installments.match(/^[0-9.]+$/)) {
                return res.status(400).send({
                    status: false,
                    message: "installments should contain Numberic values.",
                });
            }
        }
        if (!productImage)
            return res
                .status(400)
                .send({ status: false, message: "profile image is required." });

        if (!validators.isvalidImage(productImage))
            return res.status(400).send({
                status: false,
                message: "Image should be in the format of jpg, png, jpeg",
            });
        let uploadedImage = await aws.uploadFile(productImage);

        data.productImage = uploadedImage;

        let productData = await productModel.create(data)

        return res.status(201).send({ status: true, message: "Product Details Created Successufully", data: productData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }

}


//==========================================[ GET PRODUCT ]=================================================>

let getProductById = async (req, res) => {
    try {
        let productId = req.params.productId

        //---------[Validations]

        if (!validators.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'Invalid UserId Format' })

        //---------[Checking productId is Present in Db or not]

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) return res.status(404).send({ status: false, message: "Product Not Found" });

        //---------[Send Response]

        res.status(200).send({ status: true, message: 'Success!', data: checkProduct })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//==========================================[ DELETE PRODUCT ]=================================================>


let deleteProduct = async (req, res) => {
    try {
        let productId = req.params.productId

        //---------[Validations]

        if (!validators.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'Invalid UserId Format' })

        //---------[Check product is Present in Db or not]

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!checkProduct) return res.status(404).send({ status: false, message: "Book Not Found" });

        //---------[Delete product]

        let deleteData = await productModel.findOneAndUpdate(
            { _id: checkProduct },
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );

        //---------[Response send]

        res.status(200).send({ status: true, message: 'This Product has been deleted', data: deleteData });

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};


//==========================================[ GET FILTERD PRODUCT ]=================================================>

let getProduct = async (req, res) => {
    try {
        let filterProduct = req.query
        console.log(filterProduct);
        let newObject = {}
        if ('name' in filterProduct) {
            newObject.title = filterProduct.name
        }
        if ('priceGreaterThan' in filterProduct) {

            newObject.price = { $gt: filterProduct.priceGreaterThan }
        }
        if ('priceLessThan' in filterProduct) {
            if ('priceGreaterThan' in filterProduct) {
                newObject.price = { $gt: filterProduct.priceGreaterThan, $lt: filterProduct.priceLessThan }
            } else {
                newObject.price = {
                    $lt: parseInt(filterProduct.priceLessThan)
                }
            }
        }
        if('size' in filterProduct) {
            let temp = filterProduct.size.split(',').map(String)
            newObject.availableSizes = {$in: temp}
        }
        console.log(newObject);

        //---------[Find product]

        let data = await productModel.find({ $and: [newObject, { isDeleted: false }] }).sort({price: 1})

        if (Object.keys(data).length == 0) return res.status(404).send({ status: false, message: 'Product not found' });

        //---------[Response Send]

        res.status(200).send({ status: true, message: 'Book list', data: data })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports.createProduct = createProduct
module.exports.getProduct = getProduct;
module.exports.getProductById = getProductById;
module.exports.deleteProduct = deleteProduct;