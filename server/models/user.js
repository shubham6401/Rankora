const mongoose=require("mongoose");
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,

    },
    role:{
        type:String,
        enum:["executive","mediator","brand"],
        required:true,
    },
    brand:{
        type:String,
        sparse:true,
        unique:true,
    },
    
    teamCode:{
        type:String,
        sparse:true,
        unique:true,
    },
    mediatorCode:{
        type:String,
        sparse:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
});
const User=mongoose.model("User",userSchema);
module.exports=User;