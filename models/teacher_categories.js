const mongoose = require('mongoose')


const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
		default: null
    },
    image_link: {
        type: String,
        required: true,
        default: null
    }
})

module.exports = mongoose.model('teacher_categories',teacherSchema)