const mongoose = require('mongoose')


const stepTrackerSchema = new mongoose.Schema({

    employeeId: {
        type: String,
       default: null
    },
    steps: {
        type: String,
        required: true,
        default: null
    },
    km: {
        type: String,
        required: true,
        default: null
    },
    calories: {
        type: String,
        required: true,
        default: null
    },
    duration: {
        type: String,
        required: true,
        default: null
    },
    date: {
        type: String,
        required: false,
        default: null
    }
   
})

module.exports = mongoose.model('step_tracker',stepTrackerSchema)