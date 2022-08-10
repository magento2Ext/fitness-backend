const mongoose = require('mongoose')


const teacherSchema = new mongoose.Schema({
	teacher_id: {
        type: String,
        required: true,
		default: null
    },
    audio_title: {
        type: String,
        required: true,
		default: null
    },
    audio_image: {
        type: String,
        required: true,
        default: null
    },
	audio_voice: {
        type: String,
        required: true,
        default: null
    },
	audio_duration: {
        type: String,
        required: true,
        default: null
    },
	parent_cat: {
        type: String,
        required: true,
        default: null
    },
	child_cat: {
        type: String,
        required: true,
        default: null
    }
   
})

module.exports = mongoose.model('teacher_audio',teacherSchema)