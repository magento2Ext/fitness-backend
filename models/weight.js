const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({

    date: {
        type: Date,
        required: true,
		default: null
    },
    employeeId: {
        type: String,
        required: true,
        default: null
    },
    weight: {
        type: String,
        required: true,
        default: null
    },
    type: {
        type: String,
        
        default: null
        // personal | challenge
    },
    challengeId: {
        type: String,
   
        default: null
    }
});s

module.exports = mongoose.model('Weight', weightSchema)

