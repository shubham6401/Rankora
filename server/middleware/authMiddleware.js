const jwt=require("jsonwebtoken");
const verifyToken=(req,res,next)=>{
    try{
        let token=req.headers.authorization;
        if(!token){
            return res.status(401).json({
                message:"No token provided",
            })
        }
        token=token.split(" ")[1];
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        // console.log(decoded);
        req.user=decoded;
        next();

    }
    catch(err){
        console.log(err);
    }
}
module.exports=verifyToken;