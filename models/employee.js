const mongoose = require('mongoose')


const employeeSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
		default: null
    },
    lastName: {
        type: String,
        required: true,
        default: null
    },
    email: {
        type: String,
        required: true,
		unique: true
    },
    userName: {
        type: String,
        required: true,
		unique: true
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
    otp: {
        type: String,
        required: true,
        default: null
    },
    employeeType: {
        type: String,
        required: true,
        default: null
    },
    is_exclusive: {
        type: Boolean,
        default: false
    },
    referCode: {
        type: String,
        default: false
    },
    organizationId: {
        type: String,
        default: false
    }

})

module.exports = mongoose.model('Employee',employeeSchema)