const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({

    challengeId: {
        type: String,
        required: true,
        default: null
    },
    title: {
        type: String,
        required: true,
        default: null
    },
    description: {
        type: String,
        required: true,
        default: null
    },
    attachement: {
        type: String,
        required: true,
        default: null
    },
    activityDate: {
        type: String,
        required: true,
        default: null
    },

}, {timestamps: true});

module.exports = mongoose.model('Activity', activitySchema)

