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
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    password: {
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
        default: 'Individual',
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
    },
    picture: {
		type: String,
		default:"https://www.kindpng.com/picc/m/24-248253_user-profile-default-image-png-clipart-png-download.png"
	},
    isVerified: {
        type: Boolean,
        default: false
    },
    userOrganizations: {
		type: Array,
		default:[]
	}
})

module.exports = mongoose.model('Employee', employeeSchema)