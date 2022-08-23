const mongoose = require('mongoose')


const teacherSchema = new mongoose.Schema({
	teacherId: {
        type: String,
        required: true,
		default: null
    },
    catId: {
        type: String,
        required: true,
        default: null
    },
    title: {
        type: String,
        required: true,
		default: null
    },
    image: {
        type: String,
        required: true,
        default: null
    },
	url: {
        type: String,
        required: true,
        default: null
    },
	duration: {
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

module.exports = mongoose.model('teacher_audio',teacherSchema)