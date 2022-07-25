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
        const salt = await bcrypt.genSalt(10);

        bcrypt.hash(password, salt, async function (err, hash) {
            // Store hash in database here
            if (err) return res.status(500).send({ status: false, message: err.message })
            data.password = await bcrypt.hash(data.password, salt);
        });
        //  data.password = req.password

        //------------------------------

        if (!profileImage)
            return res
                .status(400)
                .send({ status: false, message: "profile image is required." });
        console.log(profileImage)
        if (!validators.isvalidImage(profileImage))
            return res
                .status(400)
                .send({
                    status: false,
                    message:
                        "Image should be in the format of jpg, png, jpeg",
                });
        //--------------------------------
        let uploadedImage = await aws.uploadFile(profileImage)

        data.profileImage = uploadedImage

        let create = await userModel.create(data)
        res.send(create)

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const userLogin = async function (req, res) {
    try {
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, message: "please enter emailId and password" })
        }
        let userName = req.body.email;
        if (!userName)
            return res.status(400).send({ status: false, message: 'please enter emailId' });

        let password = req.body.password;
        if (!password)
            return res.status(400).send({ status: false, message: 'please enter password' });

        let user = await userModel.findOne({
            email: userName
        });
        if(!user){
            return res.status(401).send({
                status : false,
                message : "Email Id not correct"
            })
        }
        if (user) {
            // check user password with hashed password stored in the database
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).send({ status :false, message: "Invalid Password" });
            }
        }

        let token = jwt.sign(
            {
                userId: user._id.toString(),
            },
            "projectGroup06",
            { expiresIn: '60m' }
        );
        res.setHeader('x-api-key', token);  
        return res.status(200).send({
            status : true,
            userId: user._id,
            token : token
        })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};
module.exports.createUser = createUser
module.exports.userLogin = userLogin