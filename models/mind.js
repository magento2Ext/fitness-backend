const mongoose = require('mongoose');
const MindSchema = new mongoose.Schema({

    employeeId: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        required: true
    },
    moodScore: {
        type: String,
        required: true,
        default: '0'
    }

}, {timestamps: true});

module.exports = mongoose.model('mind', MindSchema)

//mood Types happy | sad | grateful | excited | bored | amused

