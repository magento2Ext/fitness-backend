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
        type: number,
        default: 0
    }
})

module.exports = mongoose.model('employee_step_target',employeeStepTargetSchema)