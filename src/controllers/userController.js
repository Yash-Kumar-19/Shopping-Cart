const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validators = require("../validator/validtor");
const aws = require("../aws/awsS3");

//==========================================[ CREATE ]=================================================>

const createUser = async (req, res) => {
  try {
    let data = req.body;
    let profileImage = req.files[0];
    console.log(data);

    if (!validators.isValidRequestBody(req.body))
      return res.status(400).send({
        status: false,
        message:
          "Invalid request parameter. Please provide user details in request body.",
      });

    let { fname, lname, email, password, phone, address } = data;

    //---------------[validations]-----------------------\\
    //<-------(Name)--------->
    if (!validators.isValidField(fname))
      return res
        .status(400)
        .send({ status: false, message: "first Name is required." });

    if (!fname.match(/^[A-Za-z ]+$/)) {
      return res.status(400).send({
        status: false,
        message: "first Name should contain only alphabets",
      });
    }
    if (!validators.isValidField(lname))
      return res
        .status(400)
        .send({ status: false, message: "last Name is required." });

    if (!lname.match(/^[A-Za-z ]+$/)) {
      return res.status(400).send({
        status: false,
        message: "last Name should contain only alphabets",
      });
    }

    //<-------(Phone)--------->
    if (!validators.isValidField(phone)) {
      return res
        .status(400)
        .send({ status: false, message: "Phone Number is required." });
    }
    if (typeof phone == "string") {
      phone = phone.toString();
    }
    if (!validators.isValidMobileNo(phone))
      return res.status(400).send({
        status: false,
        message:
          "Invalid phone number. Please enter a valid Indian phone number.",
      });

    let mobileAlreadyExists = await userModel.findOne({ phone });

    if (mobileAlreadyExists)
      return res.status(400).send({
        status: false,
        message: "Phone number has already been used.",
      });

    //<-------(Email)--------->
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

    //<-------(Password)--------->
    if (!validators.isValidField(password))
      return res
        .status(400)
        .send({ status: false, message: "Password is required." });

    if (!validators.isValidPassword(password))
      return res.status(400).send({
        status: false,
        message:
          "Password should consist a minimum of 8 characters and a maximum of 15 characters.",
      });
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err)
        return res.status(500).send({ status: false, message: err.message });
      data.password = hash;
    });

    //<-------(Image)--------->

    if (!profileImage)
      return res
        .status(400)
        .send({ status: false, message: "profile image is required." });

    if (!validators.isvalidImage(profileImage))
      return res.status(400).send({
        status: false,
        message: "Image should be in the format of jpg, png, jpeg",
      });
    let uploadedImage = await aws.uploadFile(profileImage);

    data.profileImage = uploadedImage;
    if (!address) {
      return res
        .status(400)
        .send({ status: false, message: "Address is required." });
    }
    //<--------------(Address)--------------->
    if (address) {
      if (address) {
        const passAddress = JSON.parse(data.address);
        address = passAddress;
        data.address = address;
      }
      let { shipping, billing } = address;

      //<----(Shipping)----->
      if (!address.shipping) {
        return res
          .status(400)
          .send({ status: false, message: "Shipping address is required." });
      }

      if (shipping) {
        let { street, city, pincode } = shipping;

        if (!street)
          return res
            .status(400)
            .send({ status: false, message: "Shipping Street is required." });

        if (!city)
          return res
            .status(400)
            .send({ status: false, message: "Shipping City is required." });

        if (!validators.isvalidCity(city)) {
          return res
            .status(400)
            .send({ status: false, message: "City name is not valid." });
        }

        if (!pincode)
          return res
            .status(400)
            .send({ status: false, message: "Shipping Pincode required." });
        pincode = pincode.toString();
        if (!validators.isvalidPin(pincode)) {
          return res
            .status(400)
            .send({ status: false, message: "Pincode is not valid." });
        }
      }

      //<----(billing)----->
      if (!billing) {
        return res
          .status(400)
          .send({ status: false, message: "Billing address is required." });
      }

      if (billing) {
        let { street, city, pincode } = billing;

        if (!street)
          return res
            .status(400)
            .send({ status: false, message: "Billing Street is required." });

        if (!city)
          return res
            .status(400)
            .send({ status: false, message: "Billing City is required." });

        if (!validators.isvalidCity(city)) {
          return res
            .status(400)
            .send({ status: false, message: "City name is not valid." });
        }

        if (!pincode)
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
    }

    //<--------(response)---------->

    let create = await userModel.create(data);
    res.status(201).send({ status: true, data: create });

  } catch (err) {
    return res.status(500).send({ status: false, message: err.stack });
  }
};

//==========================================[ LOGIN ]=================================================>

const userLogin = async function (req, res) {
  try {
    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter emailId and password" });
    }
    let userName = req.body.email;
    if (!userName)
      return res
        .status(400)
        .send({ status: false, message: "please enter emailId" });

    let password = req.body.password;
    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "please enter password" });

    let user = await userModel.findOne({
      email: userName,
    });
    if (!user) {
      return res.status(401).send({
        status: false,
        message: "Email Id not correct",
      });
    }
    if (user) {
      // check user password with hashed password stored in the database
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res
          .status(401)
          .send({ status: false, message: "Invalid Password" });
      }
    }

    let token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      "projectGroup06",
      { expiresIn: "24h" }
    );
    res.setHeader("x-api-key", token);
    return res.status(200).send({
      status: true,
      message: "User Login Successfull",
      data:
      {userId: user._id,
      token: token,}
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//==========================================[ GET ]=================================================>

const getUser = async (req, res) => {
  try {
    let userRequesting = req.params.userId;

    if (!validators.isValidObjectId(userRequesting)) {
      return res.status(400).send({
        status: false,
        message: "Not a valid userId",
      });
    }
    let findUser = await userModel.findOne({ _id: userRequesting });
    if (!findUser) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }
    let userAccessing = req.validToken.userId;
    if (userRequesting != userAccessing) {
      return res.status(403).send({
        status: false,
        message: "User not authorised",
      });
    }
    return res.status(200).send({
      status: true,
      message: "User Profile Details",
      data: findUser,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//==========================================[ UPDATE ]=================================================>

const updateUser = async (req, res) => {
  try {
    //--------(getUser Id)
    let userRequesting = req.params.userId;

    if (!validators.isValidObjectId(userRequesting)) {
      return res.status(400).send({
        status: false,
        message: "Not a valid userId",
      });
    }
    //--------(Find Document with Id)
    let findUser = await userModel.findOne({ _id: userRequesting });
    if (!findUser) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }
    //---------(Authorization)
    let userAccessing = req.validToken.userId;
    if (userRequesting != userAccessing) {
      return res.status(403).send({
        status: false,
        message: "User not authorised",
      });
    }
    //---------(Get data)
    let data = req.body;

    if (!validators.isValidRequestBody(req.body))
      return res.status(400).send({
        status: false,
        message:
          "Invalid request parameter. Please provide user details in request body.",
      });

    //---------(Empty Object)
    let updateObject = findUser;

    // ========================[Updating]========================
    //---------(Fname)
    if ("fname" in data) {
      if (!validators.isValidField(data.fname))
        return res
          .status(400)
          .send({ status: false, message: "first Name is required." });

      if (!data.fname.match(/^[A-Za-z ]+$/)) {
        return res.status(400).send({
          status: false,
          message: "first Name should contain only alphabets",
        });
      }
      updateObject.fname = data.fname;
    }

    //---------(lname)
    if ("lname" in data) {
      if (!validators.isValidField(data.lname))
        return res
          .status(400)
          .send({ status: false, message: "first Name is required." });

      if (!data.lname.match(/^[A-Za-z ]+$/)) {
        return res.status(400).send({
          status: false,
          message: "last Name should contain only alphabets",
        });
      }
      updateObject.lname = data.lname;
    }
    //---------(Email)
    if ("email" in data) {
      if (!validators.isValidField(data.email))
        return res
          .status(400)
          .send({ status: false, message: "email is required." });

      if (!validators.isValidEmail(data.email)) {
        return res.status(400).send({
          status: false,
          message: "email is not a valid",
        });
      }
      let emailAlreadyExists = await userModel.findOne({ email: data.email });

      if (emailAlreadyExists)
        return res.status(400).send({
          status: false,
          message: "email has already been used.",
        });

      updateObject.email = data.email;
    }
    //---------(Phone)
    if ("phone" in data) {
      if (!validators.isValidField(data.phone)) {
        return res
          .status(400)
          .send({ status: false, message: "Phone Number is required." });
      }

      if (!validators.isValidMobileNo(data.phone))
        return res.status(400).send({
          status: false,
          message:
            "Invalid phone number. Please enter a valid Indian phone number.",
        });

      let mobileAlreadyExists = await userModel.findOne({ phone: data.phone });

      if (mobileAlreadyExists)
        return res.status(400).send({
          status: false,
          message: "Phone number has already been used.",
        });
      updateObject.phone = data.phone;
    }

    //---------(Password)

    if ("password" in data) {
      if (!validators.isValidField(data.password)) return res.status(400).send({ status: false, message: "Password is required." });

      if (!validators.isValidPassword(data.password)) return res.status(400).send({ status: false, message: "Password should consist a minimum of 8 characters and a maximum of 15 characters.", });

      const saltRounds = 10;

      const hash = await bcrypt.hash(data.password, saltRounds);
      updateObject.password = hash;
    }

    //---------(Profile Image)
    let profileImage = req.files[0];
    if (profileImage) {
      if (!validators.isvalidImage(profileImage))
        return res.status(400).send({
          status: false,
          message: "Image should be in the format of jpg, png, jpeg",
        });
      let uploadedImage = await aws.uploadFile(profileImage);

      updateObject.profileImage = uploadedImage;
    }

    //----------(Address)
    if (data.address) {
      const passAddress = JSON.parse(data.address);
      address = passAddress;
      let { shipping, billing } = address;

      //Shipping
      if ("shipping" in address) {
        let { street, city, pincode } = shipping;
        if (street) {
          updateObject.address.shipping.street = street;
        }
        if (city) {
          updateObject.address.shipping.city = city;
        }
        if (pincode) {
          if (!validators.isvalidPin(pincode)) {
            return res
              .status(400)
              .send({ status: false, message: "Pincode is not valid." });
          }
          updateObject.address.shipping.pincode = pincode;
        }
      }
      //Billing
      if ("billing" in address) {
        let { street, city, pincode } = billing;
        if (street) {
          updateObject.address.billing.street = street;
        }
        if (city) {
          updateObject.address.billing.city = city;
        }
        if (pincode) {
          if (!validators.isvalidPin(pincode)) {
            return res
              .status(400)
              .send({ status: false, message: "Pincode is not valid." });
          }
          updateObject.address.billing.pincode = pincode;
        }
      }
    }
    //-----(Save document)
    await findUser.save()

    //---------(Send Response)
    return res.status(200).send({ status: true, message: "User Profile updated successfully", data: findUser });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.stack });
  }
};

//=================================[ Exports ]================================>
module.exports.createUser = createUser;
module.exports.userLogin = userLogin;
module.exports.getUser = getUser;
module.exports.updateUser = updateUser;