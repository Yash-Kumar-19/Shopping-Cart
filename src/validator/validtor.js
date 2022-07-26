// ================ imports ===========================================================================================//

const mongoose = require("mongoose");

// ================ Field Validation ===========================================================================================//

const isValidField = function (value) {
  if (typeof value === "undefined" || value === null) return false;

  if (typeof value === "string" && value.trim().length === 0) return false;

  return true;
};

// ================ requestBody Validation ===========================================================================================//

const isValidRequestBody = function (requestBody) {
  return Object.keys(requestBody).length > 0;
};

// ================ Field Validation ===========================================================================================//

const isValidObjectId = function (ObjectId) {
  if (!mongoose.Types.ObjectId.isValid(ObjectId)) return false;

  return true;
};



// ================ URL Validation ===========================================================================================//

const isValidURL = function (link) {
  return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)\.[a-z]{2,5}(:[0-9]{1,5})?(\/.)?$/.test(
    link
  );
};

// ================ Mobile No. Validation ===========================================================================================//

const isValidMobileNo = function (mobile) {
  return /((\+91)?0?)?[6-9]\d{9}$/.test(mobile);
};

// ================ Email Validation ===========================================================================================//

const isValidEmail = function (email) {
  return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email);
};

// ================ Password Validation ===========================================================================================//

const isValidPassword = function (password) {
    
    regexpass = /^[A-Za-z\d@$!%*?&]{8,15}$/;
    return regexpass.test(password);
};

// ================ Image Validation ===========================================================================================//

const isvalidImage = function (profileImage) {
  return  /\.(jpe?g|tiff?|png|webp|bmp)$/i.test(profileImage.originalname)
}

// ================ Address Validation ===========================================================================================//

// const isValidAddress = function (address){
//   if (typeof address !== 'object' || Array.isArray(address) || Object.keys(address).length == 0) {
//     return false  
//   }else{
//     return true
//   }
// }

const isvalidPin = function (pincode){
  return /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/.test(pincode)
}
const isvalidCity = function (city){
  return /^[a-zA-z',.\s-]{1,25}$/.test(city)
}




// ================ exports ===========================================================================================//

module.exports = {
  isValidField,
  isValidRequestBody,
  isValidEmail,
  isValidMobileNo,
  isValidURL,
  isValidObjectId,
  isValidPassword,
  isvalidImage,
  isvalidPin,
  isvalidCity
};