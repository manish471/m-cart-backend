const mongoose = require('mongoose');

const productTypeSchema = mongoose.Schema({

    name:{
        required:true,
        type:String,
        unique:1,
        maxlength:100
    }

});

const ProductType = mongoose.model('ProductType',productTypeSchema);

module.exports = {ProductType};