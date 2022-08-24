const mongoose = require('mongoose')


const teacherSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
		default: null
    },
    name: {
        type: String,
        required: true,
		default: null
    },
    image_link: {
        type: String,
        required: false,
        default: null
    }
})

module.exports = mongoose.model('teacher_categories', teacherSchema)