const mongoose = require('mongoose')


const educationSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        default: null
    },
   
    description: {
        type: String,
        required: true,
        default: null
    },
   
    placeholder_image: {
        type: String,
        required: true,
        default: null
    },
	
    video_link: {
        type: String,
        required: true,
        default: null
    },
	
    moduleId: {
        type: String,
        required: true,
        default: null
    }
   
})

module.exports = mongoose.model('education',educationSchema)