const mongoose = require('mongoose')


const organizationSchema = new mongoose.Schema({

    organizationName: {
        type: String,
        required: true,
		default: null
    },
    /*logo: {
        type: String,
        required: true,
		default: null
    },*/
    email: {
        type: String,
        required: true,
        default: null
    },
    password: {
        type: String,
        required: true,
        default: null
    },
    zipCode: {
        type: String,
        required: true,
        default: null
    },
    referCode: {
        type: String,
        required: true,
        default: null
    },
	logo: {
        type: String,
       default:"https://soulcialapp.s3.amazonaws.com/AppImages/Frame%403x.png"
    },
	themecode: {
        type: String,
        default: null
    },
    modules: {
        type: String,
        required: true,
        default: null
    },
	module_id: {
        type: String,
        default: null
    },
	subModule_id: {
        type: String,
        required: false,
        default: null
    },
    status: {
        type: String,
        default: '1' 
    },
    stripe_id: {
        type: String,
        default: null
    }
})
  
module.exports = mongoose.model('Organization',organizationSchema)