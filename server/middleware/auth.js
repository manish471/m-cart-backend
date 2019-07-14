const { User } = require('../models/users');


let auth = (req,res,next)=>{
    console.log(req.query);
    console.log(req.cookies)
    let token = req.cookies.w_auth;
    
    User.findByToken(token,(err,user)=>{
        if(err) throw err;

        if(!user) return res.json({
            isAuth:false,
            error:true
        });

        req.token = token;
        req.user = user;
        next();
    })

}


module.exports = { auth }