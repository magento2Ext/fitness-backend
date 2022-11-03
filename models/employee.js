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
    userOrganizations: {
		type: Array,
		default:[]
	},
    picture: {
		type: String,
		default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png"
	},
    isVerified: {
        type: Boolean,
        default: false
    },
    seenDisclaimer: {
        type: Boolean,
        default: false
	},
    seenGuide: {
        type: Boolean,
        default: false
	},
    date: {
        type: String,
		default: '2022-07-02'
    },
    status: {
        type: String,
        default: '1'
    },
    height: {
        type: String,
        default: '0'
    },
    heightType: {
        type: String
    },
    deviceToken: {
        type: String,
        default: null
    }
})

module.exports = mongoose.model('Employee', employeeSchema)