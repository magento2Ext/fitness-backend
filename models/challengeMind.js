const mongoose = require('mongoose');

const challengeMindSchema = new mongoose.Schema({

    employeeId: {
        type: String,
        required: true
    },
    activityId: {
        type: String,
        required: true
    },
    challengeId: {
        type: String,
        required: true,
        default: null
    }

}, {timestamps: true});

module.exports = mongoose.model('challengeMind', challengeMindSchema)

