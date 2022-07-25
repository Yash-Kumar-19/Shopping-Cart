const userModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const validators = require('../validator/validtor')
const { response } = require('express')
const aws = require('../aws/awsS3')



const createUser = async (req, res) => {
    try {
        let data = req.body
        let profileImage = req.files[0]
        if (!validators.isValidRequestBody(req.body))
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Invalid request parameter. Please provide user details in request body.",
                });

        let { fname, lname, email, password, phone, address } = data

        console.log(profileImage)
        //------validations-----------

        if (!validators.isValidField(fname))
            return res
                .status(400)
                .send({ status: false, message: "first Name is required." });

        if (!fname.match(/^[A-Za-z ]+$/)) {
            return res.status(400).send({
                status: false,
                message: "first Name should contain only alphabets"
            })
        }
        if (!validators.isValidField(lname))
            return res
                .status(400)
                .send({ status: false, message: "last Name is required." });

        if (!lname.match(/^[A-Za-z ]+$/)) {
            return res.status(400).send({
                status: false,
                message: "last Name should contain only alphabets"
            })
        }

        //-----(phone)
        if (!validators.isValidField(phone)) {
            return res
                .status(400)
                .send({ status: false, message: "Phone Number is required." });
        }
        if (typeof (phone) == 'number') {
            phone = phone.toString()
        }
        if (!validators.isValidMobileNo(phone))
            return res
                .status(400)
                .send({
                    status: false,
                    message:
                        "Invalid phone number. Please enter a valid Indian phone number.",
                });

        let mobileAlreadyExists = await userModel.findOne({ phone });

        if (mobileAlreadyExists)
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Phone number has already been used.",
                });

        //email
        if (!validators.isValidField(email))
            return res
                .status(400)
                .send({ status: false, message: "Email is required." });

        if (!validators.isValidEmail(email))
            return res
                .status(400)
                .send({ status: false, message: "Email is invalid." });

        let emailAlreadyExists = await userModel.findOne({ email });

        if (emailAlreadyExists)
            return res
                .status(400)
                .send({ status: false, message: "Email has already been registered." });

        //password
        if (!validators.isValidField(password))
            return res
                .status(400)
                .send({ status: false, message: "Password is required." });

        if (!validators.isValidPassword(password))
            return res
                .status(400)
                .send({
                    status: false,
                    message:
                        "Password should consist a minimum of 8 characters and a maximum of 15 characters.",
                });
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) return res.status(500).send({ status: false, message: err.message })
            data.password = hash
        });

        //-----------Image-------------------

        if (!profileImage)
            return res
                .status(400)
                .send({ status: false, message: "profile image is required." });

        if (!validators.isvalidImage(profileImage))
            return res
                .status(400)
                .send({
                    status: false,
                    message:
                        "Image should be in the format of jpg, png, jpeg",
                });
        let uploadedImage = await aws.uploadFile(profileImage)

        data.profileImage = uploadedImage

        //---(Address)

        console.log(address);
        if (!validators.isValidAddress(address)) {
            return res.status(400).send({ status: false, message: 'Shipping  & Billing address is required.' })
        }
        let { shipping, billing } = address
        //Shipping Address
        if (!validators.isValidAddress(shipping)) {
            return res.status(400).send({ status: false, message: 'Shipping address is required.' })
        }

        if ('shipping' in address) {
            let { street, city, pincode } = shipping

            if (!validators.isValidField(street))
                return res
                    .status(400)
                    .send({ status: false, message: "Shipping Street is required." });


            if (!validators.isValidField(city))
                return res
                    .status(400)
                    .send({ status: false, message: "Shipping City is required." });

            if (!validators.isvalidCity()) {
                return res
                    .status(400)
                    .send({ status: false, message: "City name is not valid." });
            }

            if (!validators.isValidField(pincode))
                return res
                    .status(400)
                    .send({ status: false, message: "Shipping Pincode required." });
            pincode= pincode.toString()
            if (!validators.isvalidPin(pincode)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Pincode is not valid." });
            }


        }


        //Billing Address
        if (!validators.isValidAddress(billing)) {
            return res.status(400).send({ status: false, message: 'Billing address is required.' })
        }

        if ('billing' in address) {
            let { street, city, pincode } = billing

            if (!validators.isValidField(street))
                return res
                    .status(400)
                    .send({ status: false, message: "Billing Street is required." });


            if (!validators.isValidField(city))
                return res
                    .status(400)
                    .send({ status: false, message: "Billing City is required." });

            if (!validators.isvalidCity()) {
                return res
                    .status(400)
                    .send({ status: false, message: "City name is not valid." });
            }

            if (!validators.isValidField(pincode))
                return res
                    .status(400)
                    .send({ status: false, message: "Billing Pincode required." });
            pincode = pincode.toString();
            if (!validators.isvalidPin(pincode)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Pincode is not valid." });
            }
        }


        //--------------------------------

        let create = await userModel.create(data)
        res.status(201).send({ status: true, data: create })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports.createUser = createUser