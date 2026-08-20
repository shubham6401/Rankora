const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./config/cloudinary");
const verifyToken = require("../server/middleware/authMiddleware.js");


// auth
const User = require("../server/models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const Order = require("./models/order.js");


// middleware
app.use(cors());
app.use(express.json());


// claudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "orders",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    },
});

const upload = multer({ storage });





// mediator
app.post("/api/mediator/order/submit/:id", verifyToken, upload.single("orderedScreenshot"), async (req, res) => {

    try {

        let {id}=req.params;
        let order=await Order.findByIdAndUpdate(id,{
            ...req.body,
            orderedScreenshot: req.file.path,
            status:"pending_refund",

        },{new:true});
        res.status(200).json({
            success: true,
            message: "Order added successfully",
        })
    }
    catch (err) {
        console.log(err.message);
        res.status(500).json({
            success: false,
            message: err.message,
        })
    }

})

app.post("/api/mediator/refund/submit/:id", verifyToken, upload.fields([
    { name: "productReviewScreenshot", maxCount: 1 },
    { name: "invoiceScreenshot", maxCount: 1 },
    { name: "sellerFeedbackScreenShot", maxCount: 1 },
]), async (req, res) => {

    try {
        const { id } = req.params;
        let order = await Order.findByIdAndUpdate(id, {
            postDeliveryDetails: {
                success: true,
                productReviewScreenshot: req.files.productReviewScreenshot?.[0]?.path,
                invoiceScreenshot: req.files.invoiceScreenshot?.[0]?.path,
                sellerFeedbackScreenShot: req.files.sellerFeedbackScreenShot?.[0]?.path,
            },
            status:"completed",
        });
        console.log(order);

        res.status(200).json({
            success: true,
            message: "Successfully submitted refund",
        })

    }
    catch (err) {
        res.status(500).json({
            message: err.message,
            message2: "Error in refund form submit",

        })
    }

})

app.get("/api/orders/history", verifyToken, async (req, res) => {
    try {
        let orders = await Order.find({ userId: req.user.id });
        res.status(200).json({
            message: "Order fetched successfully",
            orders,
        })
    }
    catch (err) {
        console.log(err);
    }
})


app.get("/api/order/:id", verifyToken, async (req, res) => {
    try {
        let { id } = req.params;
        const order = await Order.findById(id).populate("assignedTo");
        res.status(200).json({
            message: "Order fetched successfully",
            order,
        })

    }
    catch (err) {
        res.status(500).json({
            message: err.message,
        })
    }
})




// fecth all mediators new Orders
app.get("/api/mediator/new/orders",verifyToken,async (req,res)=>{
    try{
        let orders=await Order.find({
            status:"assigned",
            assignedTo:req.user.id,
        }).populate("assignedTo");

        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }

})

// assigne to inprogress statuts accept order button
app.post("/api/mediator/order/in_progress/:orderId",verifyToken,async(req,res)=>{
    try{
        console.log("hoo");
        let {orderId}=req.params;
        
        let order=await Order.findByIdAndUpdate(orderId,{
            status:"in_progress",
        },{ new: true });
        console.log("order",order);
        res.status(200).json({
            message:"Order Accepted succeffully",
            order
        })
        

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// pending orders
app.get("/api/mediator/orders/pending",verifyToken,async(req,res)=>{
    try{
        let orders=await Order.find({
            status:"in_progress",
            assignedTo:req.user.id,
        }).populate("assignedTo");
        res.status(200).json({
            message:"Pending Orders fetched succeffully",
            orders
        })
        

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// refund pending orders
app.get("/api/mediator/orders/refund_pending",verifyToken,async(req,res)=>{
    try{
        let orders=await Order.find({
            status:"pending_refund",
            assignedTo:req.user.id,
        }).populate("assignedTo");
        res.status(200).json({
            message:" Orders with refund Pending are fetched succeffully",
            orders
        })
        

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// Completed orders
app.get("/api/mediator/orders/completed",verifyToken,async(req,res)=>{
    try{
        let orders=await Order.find({
            status:"completed",
            assignedTo:req.user.id,
        }).populate("assignedTo");
        res.status(200).json({
            message:"Completed Orders fetched succeffully",
            orders
        })
        

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// auth route mediator
// login mediator
app.post("/api/auth/login/mediator", async (req, res) => {
    try {
        let { name, mediatorCode, password } = req.body;
        let existingUser = await User.findOne({ mediatorCode });
        if (!existingUser) {
            return res.status(401).json({
                message: "User doesnot exit",
            })
        }
        const isMatchedPassword = bcrypt.compare(password, existingUser?.password);
        if (!isMatchedPassword) {
            return res.status(401).json({
                message: "Incorrect password",
            })
        }

        // jwt creation
        const token = jwt.sign({
            id: existingUser._id,
            name: existingUser.name,
            mediatorCode: existingUser.mediatorCode,
            teamCode:existingUser.teamCode,
        },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            })


        return res.status(200).json({
            message: "Login successfully",
            token,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                mediatorCode: existingUser.mediatorCode,
                teamCode:existingUser.teamCode,

            },
        });

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message,
        })
    }
})

// signup
app.post("/api/auth/signup/mediator",verifyToken, async (req, res) => {
    try {
        let { name, mediatorCode, password } = req.body;
        let existingUser = await User.findOne({ mediatorCode });
        if (existingUser) {
            return res.status(401).json({
                message: "User already registered",
            })
        }
        console.log("req.user",req.user);
        const hashedPass = await bcrypt.hash(password, 10);
        await User.create({
            name, mediatorCode, password: hashedPass,
            teamCode:req.user.teamCode,role:"mediator",
        });


        return res.status(200).json({
            message: "user registered successfully",
        })

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message,
        })
    }
})

// executive
// login 

app.post("/api/auth/login/executive", async (req, res) => {
    try {
        let { name, password, teamCode } = req.body;
        let existingUser = await User.findOne({ teamCode,
            role:"executive",
         });
        if (!existingUser) {
            return res.status(401).json({
                message: "User doesnot exist",
            })
        }

        let isMatchedPassword = await bcrypt.compare(password,existingUser?.password);
        if (!isMatchedPassword) {
            return res.status(401).json({
                message: "Incorrect password",
            })
        }

        // token creation
        let token = jwt.sign({
            id: existingUser._id,
            name: existingUser.name,
            teamCode: existingUser.teamCode,
        },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        )

        return res.status(200).json({
            message:"User logged in successfully",
            token,
            user:{
                id:existingUser._id,
                name:existingUser.name,
                teamCode:existingUser.teamCode,
            }

        })

    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message,
        })
    }
})

// signup executive
app.post("/api/auth/signup/executive", async (req, res) => {

    try {
        let { name, password, teamCode } = req.body;
        let existingUser = await User.findOne({ teamCode });
        if (existingUser) {
            return res.status(401).json({
                message: "User already registered",
            })
        }

        const hashedPass = await bcrypt.hash(password, 10);
        let user = await User.create({
            name, password:hashedPass, teamCode, role: "executive",
        })
        console.log(user);
        res.status(200).json({
            message: "User registered Successfully",
        })
    }
    catch (err) {
        console.log(err);
        res.status(400).json({
            message: err.message,
        })
    }
})

// executive orders
app.post("/api/executive/orders",verifyToken,async (req,res)=>{
    try{

        let orders=await Order.find({
            teamCode:req.user.teamCode,
        });
        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// executive orders pending
app.get("/api/executive/orders/pending",verifyToken,async (req,res)=>{
    try{

        let orders=await Order.find({
            teamCode:req.user.teamCode,
            status:"pending"
        });
        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// executive orders assigned
app.get("/api/executive/orders/assigned",verifyToken,async (req,res)=>{
    try{

        let orders=await Order.find({
            teamCode:req.user.teamCode,
            status:"assigned"
        }).populate("assignedTo");
        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// executive orders in_progress
app.get("/api/executive/orders/in_progress",verifyToken,async (req,res)=>{
    try{

        let orders=await Order.find({
            teamCode:req.user.teamCode,
            status:"in_progress"
        }).populate("assignedTo");
        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// executive orders pending_refund
app.get("/api/executive/orders/pending_refund",verifyToken,async (req,res)=>{
    try{

        let orders=await Order.find({
            teamCode:req.user.teamCode,
            status:"pending_refund"
        }).populate("assignedTo");
        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// executive orders completed
app.get("/api/executive/orders/completed",verifyToken,async (req,res)=>{
    try{

        let orders=await Order.find({
            teamCode:req.user.teamCode,
            status:"completed"
        }).populate("assignedTo");
        res.status(200).json({
            message:"Order fetched successfully",
            orders,
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// add new order for executive
app.post("/api/executive/order/add",verifyToken,async (req,res)=>{
    try{

        let order=new Order({
            ...req.body,
            createdBy:req?.user?.id,
            
        })
        await order.save();
        res.status(200).json({
            success: true,
            message: "Order added successfully",
        })

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message:err.message,
        })
    }
})

// get all mediator of particular executive
app.get("/api/executive/mediators",verifyToken,async (req,res)=>{
    try{
        let mediators=await User.find({
            role:"mediator",
            teamCode:req.user.teamCode,
        })
        res.status(200).json({
            message:"All mediators are fetched Successfully",
            mediators,
        })


    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// pending to assign statuts
app.post("/api/executive/order/assign/:orderId",verifyToken,async(req,res)=>{
    try{
        console.log("hoo");
        let {orderId}=req.params;
        let {mediatorId}=req.body;
        let mediator=await User.findById(mediatorId);
        if (!mediator) {
            return res.status(404).json({
                message: "Mediator not found"
            });
        }
        let order=await Order.findByIdAndUpdate(orderId,{
            assignedTo:mediatorId,
            status:"assigned",
        },{ new: true });
        console.log("order",order);
        res.status(200).json({
            message:"Order assigned succeffully",
            order
        })
        

    }
    catch(err){
        console.log(err);
        res.status(500).json({
            message:err.message,
        })
    }
})

// database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        app.listen(8000, () => {
            console.log("Server Running");
        });
    })

