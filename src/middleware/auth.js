const jwt = require("jsonwebtoken");

// Model
const EmployeeModel = require('../models/Employee');

const auth = async(req,res,next)=>{

    try{
        const token = req.header('Authorization').replace('Bearer','').trim();
        const decoded = jwt.verify(token,'GCBVMNVMBKJSECRETKEY');
        const user = await EmployeeModel.findOne({_id:decoded._id,'tokens.token':token});
        
        if(!user){
            throw new Error();
        }

        // Set Parameters
        req.token = token;
        req.user = user;
    }
    catch (e)
    {
        res.status(401).send({'error' : 'Please Authenticate..'});
    }
    
    next();
}

module.exports = auth;