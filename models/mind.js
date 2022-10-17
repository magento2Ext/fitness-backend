const mongoose = require('mongoose');
const MindSchema = new mongoose.Schema({

    employeeId: {
        type: String,
        required: true
    },
    activityId: {
        type: String,
        required: true
    },
    reaction: {
        type: String,
        required: true
    }

}, {timestamps: true});

module.exports = mongoose.model('mind', MindSchema)

