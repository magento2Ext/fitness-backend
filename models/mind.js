const mongoose = require('mongoose');

const mindSchema = new mongoose.Schema({

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
    },
    type: {
        type: String,
        required: true,
        default: null
    }

}, {timestamps: true});

module.exports = mongoose.model('Mind', mindSchema)

