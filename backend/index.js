const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const midtransClient = require('midtrans-client');
const { type } = require("os");
const { error } = require("console");

app.use(express.json());
app.use(cors());

// Database Connection with MongoDB
mongoose.connect("mongodb+srv://carrillodev:C%40rrillo10@cluster0.yei9miu.mongodb.net/Ecommerce");

// API creation 

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

// Image Storage Engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

// Creating Upload Endpoint for Images
app.use('/images', express.static('upload/images'))

app.post("/upload",upload.single('product'), (req,res) => {
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for Creating Products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else {
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,

    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// Creating API For Deleting Product
app.post('/removeproduct', async (req,res)=>{
    await Product.findOneAndDelete({
        id:req.body.id
    });
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// Creating API for Getting All Products
app.get('/allproducts', async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

// Schema creating for User model

const Users = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// Creating Endpoint for registering the user
app.post('/signup',async(req,res)=>{
    
    let check = await Users.findOne({email:req.body.email});
    if(check) {
        return res.status(400).json({success:false,errors:"existing user found with same email"})
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();


    const data = {
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})

// creating endpoint for user login
app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user) {
        const passCompare = req.body.password === user.password;
        if(passCompare) {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Password Salah!"});
        }
    }
    else {
        res.json({success:false,errors:"Email Salah!"})
    }
})

// creating endpoint for newcollection
app.get('/newcollections',async (req,res)=> {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

// creating endpoint for women section
app.get('/popularwomen', async (req,res) => {
    let products = await Product.find({category:"women"});
    let popular_women = products.slice(0,4);
    console.log("PopularWomen Fetched");
    res.send(popular_women);
})

// creating middleware to fetch user
const fetchUser = async(req,res,next) => {
    const token = req.header('auth-token');
    if(!token) {
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else{
        try{
            const data = jwt.verify(token,'secret-ecom');
            req.user = data.user;
            next();
        }catch (error) {
            res.status(401).send({errors:"please authenticate using a valid token"})
        }
    }
}

// app.post('/addtocart', fetchUser, async (req, res) => {
//     try {
//         let userData = await Users.findOne({ _id: req.user.id });
//         userData.cartData[req.body.itemId] += 1;
//         await userData.save();
//         res.send("Added");
//     } catch (error) {
//         console.error("Error adding to cart: ", error);
//         res.status(500).send("Server Error");
//     }
// });

// app.post('/removefromcart', fetchUser, async (req, res) => {
//     try {
//         let userData = await Users.findOne({ _id: req.user.id });
//         if (userData.cartData[req.body.itemId] > 0) {
//             userData.cartData[req.body.itemId] -= 1;
//             await userData.save();
//         }
//         res.send("Removed");
//     } catch (error) {
//         console.error("Error removing from cart: ", error);
//         res.status(500).send("Server Error");
//     }
// });

// creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser, async (req,res) => {
    console.log("Added",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

// //creating endpoint to remove product from cartdata
app.post('/removefromcart',fetchUser,async (req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

// creating endpoint to get cartdata
app.post('/getcart',fetchUser,async (req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

const coreApi = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: 'SB-Mid-server-PVBusLUc2QR7pHwjeq_UBB4H',
    clientKey: 'SB-Mid-client-HoNucP4vhsA-N-Es',
});

app.post('/savecart', fetchUser, async (req, res) => {
    try {
        let userData = await Users.findOne({ _id: req.user.id });
        userData.cartData = req.body.cartData;
        await userData.save();
        res.send("Cart saved");
    } catch (error) {
        console.error("Error saving cart: ", error);
        res.status(500).send("Server Error");
    }
});

// app.post('/checkout', async (req,res) => {
//     const transactionDetails = {
//         orderId: 'ID_PESANAN',
//         grossAmount: req.body.amount,
//     };
//     const creditCardOptions = {
//         secure:true,
//     };
//     const itemDetails = [
//         {
//         id: 'ID_BARANG',
//         price: req.body.amount,
//         quantity: 1,
//         name: 'Nama Barang',
//         },
//     ];
//     try{
//         const chargeResponse = await coreApi.chargeCard(transactionDetails, req.body.tokenId, creditCardOptions, itemDetails);
//         res.json({ success: true, transactionId: chargeResponse.transactionId});
//     } catch(error) {
//         res.status(500).json({success:false, error: error.message});
//     }
// });

// app.post('/midtrans/callback', async (req, res) => {
//     const orderId = req.body.order_id;
//     const transactionStatus = req.body.transaction_status;
//     // Perbarui status pembayaran di basis data Anda berdasarkan transactionStatus
//     // Tanggapi panggilan balik Midtrans dengan kode status HTTP yang sesuai
//     res.sendStatus(200);
// });

app.post('/checkout', async (req, res) => {
    const transactionDetails = {
        order_id: `order-${Date.now()}`,
        gross_amount: req.body.amount,
    };
    const itemDetails = [{
        id: req.body.id,
        price: req.body.amount,
        quantity: 1,
        name: req.body.name,
    }];
    const customerDetails = {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
    };
    const parameter = {
        transaction_details: transactionDetails,
        item_details: itemDetails,
        customer_details: customerDetails,
    };
    try {
        const chargeResponse = await coreApi.charge(parameter);
        res.json({ success: true, transactionId: chargeResponse.transaction_id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Creating Endpoint for Midtrans Callback
app.post('/midtrans/callback', async (req, res) => {
    const orderId = req.body.order_id;
    const transactionStatus = req.body.transaction_status;
    
    try {
        // Temukan pesanan berdasarkan orderId
        let order = await Order.findOne({ orderId: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Perbarui status pembayaran berdasarkan transactionStatus
        switch (transactionStatus) {
            case 'capture':
                if (req.body.payment_type === 'credit_card') {
                    if (req.body.fraud_status === 'challenge') {
                        order.paymentStatus = 'challenge';
                    } else if (req.body.fraud_status === 'accept') {
                        order.paymentStatus = 'success';
                    }
                }
                break;
            case 'settlement':
                order.paymentStatus = 'success';
                break;
            case 'deny':
                order.paymentStatus = 'deny';
                break;
            case 'cancel':
            case 'expire':
                order.paymentStatus = 'expire';
                break;
            case 'pending':
                order.paymentStatus = 'pending';
                break;
            default:
                order.paymentStatus = 'unknown';
                break;
        }

        // Simpan perubahan status di database
        await order.save();

        // Tanggapi panggilan balik Midtrans dengan kode status HTTP yang sesuai
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling Midtrans callback:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.listen(port,(error)=>{
    if(!error) {
        console.log("Server Running on Port"+port)
    }
    else 
    {
        console.log("Error : "+error)
    }

    
})