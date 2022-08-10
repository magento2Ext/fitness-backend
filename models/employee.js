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
		//unique: true
    },
    userName: {
        type: String,
        required: true
		//unique: true
    },
    password: {
        type: String,
        required: true,
        default: null
    }/* ,
    zipCode: {
        type: String,
        default: null
    } */,
    otp: {
        type: String,
        required: true,
        default: null
    }/* ,
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
		required: true,
        default: false
    } */,
    organizationId: {
        type: String,
        default: false
    },
    picture: {
		type: String,
		default:"https://soulcial.s3.us-west-2.amazonaws.com/MicrosoftTeams-image+(1).png"
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