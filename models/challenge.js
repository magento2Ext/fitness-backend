const mongoose = require('mongoose')

const challengeSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true,
		default: null
    },
    type: {
        type: String,
        required: true,
        default: null
    },
    orgType:  {
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
    pic: {
        type: String,
        required: true,
        default: null
    },
    participants: {
        type: [],
        default: []
    },
    invites: {
        type: [],
        default: []
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true,
        default: null
    },
    status: {
        type: String,
        required: true,
        default: 'new'
    },
    winners: {
        type: String,
        required: true,
    }
})

module.exports = mongoose.model('Challenge', challengeSchema)