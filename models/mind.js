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
    }

}, {timestamps: true});

module.exports = mongoose.model('mind', MindSchema)

//mood Types happy | sad | 

