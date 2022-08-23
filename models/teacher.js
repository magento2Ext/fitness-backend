const mongoose = require('mongoose')


const teacherSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
		default: null
    },
    teacher_image: {
        type: String,
        required: false,
        default: null
    },
    orgId: {
        type: String,
        required: true,
        default: null
    },
    type: {
        type: String,
        required: true,
        default: null
    }
   
})

module.exports = mongoose.model('teachers', teacherSchema)