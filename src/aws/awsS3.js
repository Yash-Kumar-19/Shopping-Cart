
const aws = require("aws-sdk")
try {
    aws.config.update({
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
    })
   } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }

    let uploadFile = async (file) => {

        return new Promise(function (resolve, reject) {
            // this function will upload file to aws and return the link
            let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

            var uploadParams = {
                ACL: "public-read",
                Bucket: "classroom-training-bucket",  //HERE
                Key: "abc/" + file.originalname, //HERE 
                Body: file.buffer
            }


            s3.upload(uploadParams, function (err, data) {
                if (err) {
                    return reject({ "error": err })
                }
                return resolve(data.Location)
            })

        })
    }




module.exports.uploadFile = uploadFile