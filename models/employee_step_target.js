const mongoose = require('mongoose')

const employeeStepTargetSchema = new mongoose.Schema({

    employeeId: {
        type: String,
       default: null
    },
    step_target: {
        type: String,
        required: true,
        default: null
    },   
    date: {
        type: String,
        required: false,
        default: null
    },
    type: {
        type: String,
        required: true,
    },
    steps: {
        type: Number,
        default: 0
    },
    duration: {
        type: String,
        default: "00:00:00"
    }
})

module.exports = mongoose.model('employee_step_target',employeeStepTargetSchema)