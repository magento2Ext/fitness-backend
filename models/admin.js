const mongoose = require('mongoose')


const adminSchema = new mongoose.Schema({

    name: {
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
    status: {
        type: String,
        required: true,
        default: '1'
    }
   
})

module.exports = mongoose.model('Admin', adminSchema)