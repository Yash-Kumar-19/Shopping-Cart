// =================================[ imports ]==========================================>>

const jwt = require('jsonwebtoken');


// <<========================[ Authentication Middleware ]===========================>>

const authentication = async function (req, res, next) {

    try {
        if (!req.headers.authorization) return res.status(400).send({ status: false, message: 'Header is missing' });
        const authheader = req.headers.authorization.split(' ')
        const token = authheader[1]

        if (!token)
            return res.status(400).send({ status: false, msg: "request is missing a mandatory token." });

        jwt.verify(token, 'projectGroup06', (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    status: false,
                    message: "Authentication Failed due to invalid token or token expired"
                })
            }
            else {
                req.validToken = decoded;
                next();
            }
        });

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
};

// <<========================[ Exports ]===========================>>

module.exports.authentication = authentication;