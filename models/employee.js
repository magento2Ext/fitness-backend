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
		default:"https://soulcial-app.s3.us-west-2.amazonaws.com/appImages/Frame%403x.png"
	},
    isVerified: {
        type: Boolean,
        default: false
    },
    userOrganizations: {
		type: Array,
		default:[]
	},
    seenDisclaimer: {
        type: Boolean,
        default: false
	},
    seenGuide: {
        type: Boolean,
        default: false
	}
})

module.exports = mongoose.model('Employee', employeeSchema)