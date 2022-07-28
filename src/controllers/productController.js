//==========================================[ Imports ]=================================================>
const productModel = require("../models/productModel")
const validators = require("../validator/validtor");
const aws = require("../aws/awsS3");


//==========================================[ CREATE PRODUCT ]=================================================>
const createProduct = async (req, res) => {
    try {
        let data = req.body;
        let productImage = req.files[0];

        //------(Destructure)
        let { title, description, price, currencyId, style, availableSizes, installments } = data

        //<--------------------------------[ Validations ]-------------------------------->
        //------(Body)
        if (!validators.isValidRequestBody(req.body))
            return res.status(400).send({
                status: false,
                message:
                    "Invalid request parameter. Please provide user details in request body.",
            });

        //------(title)
        if (!validators.isValidField(title))
            return res
                .status(400)
                .send({ status: false, message: "title is required." });
        let alreadyTitle = await productModel.findOne({ title })
        if (alreadyTitle) return res.status(400).send({ status: false, message: `Title Already used is ${title}` })

        //------(description)
        if (!validators.isValidField(description))
            return res
                .status(400)
                .send({ status: false, message: "description is required." });

        //------(price)
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

        //------(currency)
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

        //------(Size)
        if (!validators.isValidField(availableSizes))
            return res.status(400).send({ status: false, message: "availableSizes is required." });

        if (validators.isValidField(availableSizes)) {
            let temp = availableSizes;

            if (typeof availableSizes == "object") data.availableSizes = temp;
            else data.availableSizes = temp.split(",").map(x => x.trim());
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
        //------(Style)
        if ("style" in data) {

            if (!validators.isValidField(style))
                return res
                    .status(400)
                    .send({ status: false, message: "style can not be empty." });

        }
        //------(Installment)
        if ("installments" in data) {

            if (!installments.match(/^[0-9.]+$/)) {
                return res.status(400).send({
                    status: false,
                    message: "installments should contain Numeric values.",
                });
            }
        }
        //------(productImage)
        if (!productImage)
            return res
                .status(400)
                .send({ status: false, message: "profile image is required." });

        if (!validators.isvalidImage(productImage))
            return res.status(400).send({
                status: false,
                message: "Image should be in the format of jpg, png, jpeg",
            });
        //------(UploadeImage on AWS)
        let uploadedImage = await aws.uploadFile(productImage);
        data.productImage = uploadedImage;

        //------(Create)
        let productData = await productModel.create(data)

        return res.status(201).send({ status: true, message: "Success", data: productData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }

}


//==========================================[ GET BY Id PRODUCT ]=================================================>

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

        if (!validators.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'Invalid productId Format' })

        //---------[Check product is Present in Db or not]

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!checkProduct) return res.status(404).send({ status: false, message: "Product Not Found" });

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


//======================================[ GET FILTERD PRODUCT ]========================================>

let getProduct = async (req, res) => {
    try {
        let filterProduct = req.query
        let newObject = {}

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
        if ('size' in filterProduct) {
            let temp;
            if (typeof availableSizes == "object") temp = availableSizes;
            else temp = filterProduct.size.split(',').map(x => x.trim())
            newObject.availableSizes = { $in: temp }
        }
        let sortPrice = 1 
        if('priceSort' in filterProduct) {
            if(filterProduct.priceSort == '-1'){
                sortPrice = -1
            }
        }
        console.log(sortPrice);
        //---------[Find product] //

        let data = await productModel.find({ $and: [newObject, { isDeleted: false }] }).sort({ price: sortPrice })

        if (data.length == 0) return res.status(404).send({ status: false, message: 'Product not found' });

        if ('name' in filterProduct) {
            let newData = []
            for (let i of data) {
                if (i.title.includes(filterProduct.name)) {
                    newData.push(i)
                }
            }
            if (newData.length == 0) return res.status(404).send({ status: false, message: 'Product not found' })
            return res.status(200).send(
                {
                    status: true,
                    message: 'Product list',
                    data: newData
                })
        }


        //---------[Response Send]

        res.status(200).send({ status: true, message: 'Product list', data: data })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}
//======================================[ Update Products ]========================================>

let updateProducts = async function (req, res) {
    try {
        let productId = req.params.productId;
        let body = req.body;
        let productImage = req.files[0]

        //-------[Validations]
        if (!validators.isValidObjectId(productId)) return res.status(400).send({ status: false, message: 'Invalid productId Format' })

        //---------[Check product is Present in Db or not]
        
        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!checkProduct) return res.status(404).send({ status: false, message: "Product Not Found" });
        
        //-------[]
        if (!validators.isValidRequestBody(body))
            return res.status(400).send({
                status: false,
                message:
                    "Invalid request parameter. Please provide user details in request body.",
            });

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = body

        if ('title' in body) {
            if (!validators.isValidField(title))
                return res
                .status(400)
                    .send({ status: false, message: "title is required." });
            let alreadyTitle = await productModel.findOne({ title })
            if (alreadyTitle) return res.status(400).send({ status: false, message: `Title Already used is ${title}` })
            checkProduct.title = title
        }

        if ('description' in body) {
            if (!validators.isValidField(description))
                return res
                    .status(400)
                    .send({ status: false, message: "description is required." });
            checkProduct.description = description
        }
        if ('price' in body) {
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
            checkProduct.price = price
        }
        if ('currencyId' in body) {
            if (currencyId != 'INR') {
                return res.status(400).send({
                    status: false,
                    message: "currencyId can be only INR.",
                });
            }
        }
        if ('currencyFormat' in body) {
            return res.status(400).send({
                status: false,
                message: "currencyFormat is already ₹ cannot be changed.",
            });
        }
        console.log(isFreeShipping != 'true' && isFreeShipping != 'false');
        if ('isFreeShipping' in body) {
            if(isFreeShipping != 'true' && isFreeShipping != 'false'){
            return res.status(400).send({ status: false, message: 'isFreeShipping is false or true'})
           }
            checkProduct.isFreeShipping = isFreeShipping
        }
        if ('style' in body) {
            if (!validators.isValidField(style))
            return res
            .status(400)
            .send({ status: false, message: "style can not be empty." });
            checkProduct.style = style
        }
        if ('installments' in body) {
            if (!installments.match(/^[0-9.]+$/)) {
                return res.status(400).send({
                    status: false,
                    message: "installments should contain Numberic values.",
                });
            }
            checkProduct.installments = installments;
        }
        if (productImage) {
            if (!validators.isvalidImage(productImage))
            return res.status(400).send({
                    status: false,
                    message: "Image should be in the format of jpg, png, jpeg",
                });
            let uploadedImage = await aws.uploadFile(productImage);

            checkProduct.productImage = uploadedImage;
        }
        if ('availableSizes' in body) {
            if (!validators.isValidField(availableSizes))
                return res.status(400).send({ status: false, message: "availableSizes is required." });

            if (validators.isValidField(availableSizes)) {
                let temp = availableSizes;

                if (typeof availableSizes == "object") availableSizes = temp;
                else availableSizes = temp.split(",").map(String);
            }

            for (let i of availableSizes) {
                let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]

                if (arr.indexOf(i) == -1) {
                    return res.status(400).send({
                        status: false,
                        message: `Sizes can only be from  ${arr}`
                    })
                }
                checkProduct.availableSizes.push(i)
            }
            checkProduct.availableSizes = [ ...new Set (checkProduct.availableSizes) ]
        }
        await checkProduct.save()

        return res.status(200).send({ status: true, message:'Update product details is successful', data: checkProduct})



    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



//======================================[ Exports ]========================================>
module.exports.createProduct = createProduct
module.exports.getProduct = getProduct;
module.exports.getProductById = getProductById;
module.exports.deleteProduct = deleteProduct;
module.exports.updateProducts = updateProducts;