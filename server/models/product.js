const mongoose = require("mongoose");
const Schema = mongoose.Schema; 

const productSchema = mongoose.Schema({

    name:{
        required:true,
        type:String,
        unique:1,
        maxlength:100,
    },
    productType:{
        required:true,
        type:Schema.Types.ObjectId,
        ref:'ProductType'
    },
    description:{
        required:true,
        type:String,
        maxlength:1000000,
    },
    price:{
        required:true,
        type:Number,
        maxlength:255,
    },
    brand:{
        required:true,
        type:Schema.Types.ObjectId,
        ref:'Brand',
    },
    shipping:{
        required:true,
        type:Boolean,
    },
    available:{
        required:true,
        type:Boolean,
    },
    sold:{
        type:Number,
        maxlength:255,
        default:0,
    },
    publish:{
        required:true,
        type:Boolean,
    },
    images:{
        type:Array,
        default:[],
    }

},{timestamps:true});

const Product = mongoose.model("Product",productSchema);
module.exports = {Product};