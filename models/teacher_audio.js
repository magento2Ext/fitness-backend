const mongoose = require('mongoose')


const teacherSchema = new mongoose.Schema({
	userId: {
        type: String,
        required: true,
		default: null
    },
    userType: {
        type: String,
        required: true,
		default: null
    },
    catId: {
        type: String,
        required: true,
        default: null
    },
    teacher: {
        type: String,
        required: false,
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
    mediaType: {
        type: String,
        required: true,
        default: null 
    },
    postType: {
        type: String,
        required: true,
        default: null  
    }

})

module.exports = mongoose.model('teacher_audio',teacherSchema)