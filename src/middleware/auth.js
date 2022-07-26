const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const userModel = require("../models/userModel")

const  authentication  = async (req,res,next)=>{
try {
    let token = req.headers['x-api-key']

    if(!token) return res.status(401).send({status:false,message:"Token must be present.."})

    const isVerify = jwt.verify(token,"projectGroup06");

    req.userDetail = isVerify;
   
    next()

} catch (error) {
    if(error.message == "invalid token" ) return res.status(400).send({status:false,message:"user has invalid token"})

    if(error.message == "invalid signature" ) return res.status(400).send({status:false,message:"user has invalid token"})

    if(error.message == "jwt expired" ) return res.status(400).send({status:false,message:"please login one more."})

     return res.status(500).send({status:false ,message:error.message})}

}


const authorisation = async (req,res,next)=>{
try {
    
    const userId = req.params.userId;

    if(!(mongoose.isValidObjectId(userId))) return res.status(400).send({status:false ,message:"Please enter valid userId"});
    
    let user = await userModel.findOne({_id:userId}); 
    
    if(!user) return res.status(404).send({status:false ,message:"User Not Found ."});

    if( userId!== user._id.toString() ) return res.status(403).send({status:false ,message:"You can't change other's data"});

    next()

} catch (error) { return res.status(500).send({status:false ,message:error.message})}
}
module.exports.authentication = authentication
module.exports.authorisation = authorisation