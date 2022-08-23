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
	catId: {
        type: String,
        required: true,
        default: null
    }
   
})

module.exports = mongoose.model('teacher_audio',teacherSchema)