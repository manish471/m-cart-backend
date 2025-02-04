const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const formidable = require('express-formidable');
const cloudinary = require('cloudinary');

const app = express();
const mongoose = require('mongoose'); 
require('dotenv').config();

mongoose.Promise = global.Promise;
mongoose.connect(encodeURI(process.env.DATABASE));

app.use(bodyParser.urlencoded({extended:true})); 
app.use(bodyParser.json());
app.use(cookieParser());

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API,
    api_secret:process.env.CLOUD_API_SECRET
})

// Models
const { User } = require('./models/users');
const {Brand} = require('./models/brand');
const {Product} = require('./models/product');
const {ProductType} = require('./models/productType');

//Middlewares
const { auth } = require('./middleware/auth');
const { admin } = require('./middleware/admin');


//test for server is connected or not

app.get('/', function(req, res) {
    res.send('connected');
});


// ===================================
//             PRODUCT_TYPE
// ===================================

app.post('/api/product/type',auth,admin,(req,res)=>{
    
    const productType = new ProductType(req.body);

    productType.save((err,doc)=>{
        if(err) return res.json({success:false,err});

        res.status(200).json({
            success:true,
            productType:doc
        })
    })

})

app.get('/api/product/type',auth,(req,res)=>{

    ProductType.find({},(err,types)=>{
        if(err) return res.status(400).send(err);

        res.status(200).send(types);
    });

})


// ===================================
//             PRODUCTS
// ===================================

app.post('/api/product',auth,admin,(req,res)=>{
    
    const product = new Product(req.body);

    product.save((err,doc)=>{
        if(err) return res.json({success:false,err});

        res.status(200).json({
            success:true,
            product:doc
        })
    })

})



// Storing filters applied by client

app.post('/api/product/filter',auth,(req,res)=>{

    const {sortBy,order,limit,skip,filters} = req.body;

    let _order = order?order:'asc';
    let _sortBy = sortBy?sortBy:'_id';
    let _limit = limit?parseInt(limit):100;
    let _skip = parseInt(skip);
    let findArgs = {};

    for(let key in filters){
        if(req.body.filters[key].length > 0){
            if(key === "price"){
                findArgs = {
                    $gte:filters[key][0],
                    $lte:filters[key][1]
                }
            }else{
                findArgs[key] = filters[key];
            }
        }
    }


    Product.
    find(findArgs).
    populate('brand').
    sort([[_sortBy,_order]]).
    skip(_skip).
    limit(_limit).
    exec((err,products)=>{
        if(err) return res.status(400).send(err);

        res.status(200).json({
            size:products.length,
            products
        })
    })


})

//sort by sell or arrival
//?sortBy=sold&order=desc&limit=4
//?publish=false
app.get('/api/product',auth,(req,res)=>{

    const {productId,sortBy,order,limit,publish} = req.query;

    let _publish = publish?publish:"none";

    if(sortBy || order || limit){
        let _order = order?order:'asc';
        let _sortBy = sortBy?sortBy:'_id';
        let _limit = limit?parseInt(limit):100;

        Product.
        find().
        populate('brand').
        sort([[_sortBy,_order]]).
        limit(_limit).
        exec((err,products)=>{
            if(err) return res.status(400).send(err);

            res.send(products);
        })
    }else if(publish === "false" || publish === "true"){

        Product.find({ 'publish' : { $eq : publish === "true"?true:false } },(err,products)=>{
            if(err) return res.status(400).send(err);

            if(productId !== undefined){
                const productById = products.filter(val=>val._id.toString() === productId)[0];
                return res.status(200).send(productById);
            }

            res.status(200).send(products);
        }).populate('brand')
          .populate('productType');
    }
    else{

        Product.find({},(err,products)=>{
            if(err) return res.status(400).send(err);

            if(productId !== undefined){
                const productById = products.filter(val=>val._id.toString() === productId)[0];
                return res.status(200).send(productById);
            }

            res.status(200).send(products);
        }).populate('brand')
          .populate('productType');

    }

})



// ===================================
//             BRANDS
// ===================================

app.post('/api/product/brand',auth,admin,(req,res)=>{

   const brand = new Brand(req.body);

   brand.save((err,doc)=>{
        if(err) return res.json({success:false,err});

        Brand.find({},(err,brands)=>{
            if(err) return res.status(400).send(err);

            res.status(200).json({
                success:true,
                brand:doc,
                resultArray:brands
            })            

        })

 
   })

})

app.get('/api/product/brands',(req,res)=>{
    Brand.find({},(err,brands)=>{
        if(err) return res.status(400).send(err);

        res.status(200).send(brands)
    })
})

// ===================================
//             USERS
// ===================================


app.get('/api/users/auth',auth,(req,res)=>{

    const {email,role,name,lastname,cart,history} = req.user;

    res.status(200).json({
        isAdmin:role === 0 ? false : true,
        isAuth : true,
        email:email,
        name : name,
        lastname:lastname,
        role:role,
        cart:cart,
        history:history
    })

})

app.post('/api/users/register',(req,res)=>{
    const user = new User(req.body);
    console.log("register processing...");


    user.save((err,doc)=>{
        if(err) return res.json({success:false,message:"Email is used already"});

        user.generateToken((err,user)=>{
            if (err) return res.status(400).send(err);

            res.cookie('w_auth',user.token).status(200).json({
                success:true,
            })
            console.log("register done..."); 
        })
    });

})

app.post('/api/users/login',(req,res)=>{

    console.log("login processing...");
    console.log(req.body);
    
    User.findOne({'email':req.body.email},(err,user)=>{
        if(!user) return res.json({loginSuccess:false,message:"Auth failed, email not found"});
   
        user.comparePassword(req.body.password,(err,isMatch)=>{
            if(!isMatch) return res.json({loginSuccess:false,message:'wrong password'})

            user.generateToken((err,user)=>{
                if (err) return res.status(400).send(err);

                res.cookie('w_auth',user.token).status(200).json({
                    loginSuccess:true,
                })
                console.log("login done..."); 
            })
        })
     })

})

app.get('/api/users/logout',auth,(req,res)=>{

    User.findOneAndUpdate(
        {_id:req.user._id},
        {token:''},
        (err,doc)=>{
            if(err) return res.json({success:false,err});

            return res.status(200).send({
                success:true
            })
        }
    )

})

app.post('/api/users/uploadImage',auth,admin,formidable(),(req,res)=>{

    console.log(req.files);
    cloudinary.uploader.upload(req.files.file.path,(result)=>{
        console.log(result)
        res.status(200).send({
            public_id:result.public_id,
            url:result.url
        })
    },
    {
        public_id:`${Date.now()}`,
        resource_type:'auto'
    }
    
    )

})

app.get('/api/users/removeImage',auth,admin,(req,res)=>{

    const {imageId} = req.query;

    cloudinary.uploader.destroy(imageId,(result,err)=>{
        if(result['result'] != 'ok') return res.json({success:false,error:result['result']});

        return res.status(200).send({
            success:true,
            result:result['result']
        })
    })

})

const port = process.env.PORT || 3002; 

app.listen(port,()=>{
    console.log(`server running at ${port}`);
})
