const mongoose = require('mongoose');

const challengeWeightSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true,
		default: null
    },
    challengeId: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('challengeWeight', challengeWeightSchema)

