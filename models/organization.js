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
    themecolor: {
        type: String,
        required: true,
        default: null
    },
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
    themeId: {
        type: String,
        required: true,
        default: null
    },
    modules: {
        type: String,
        required: true,
        default: null
    }

})

module.exports = mongoose.model('Organization',organizationSchema)