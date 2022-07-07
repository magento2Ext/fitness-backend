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
	
    module_id: {
        type: String,
        required: true,
        default: null
    },
	
    is_picture: {
        type: Boolean,
        required: true,
        default: false
    },
	created_at:{
		type: String,
		default:null
	}

   
})

module.exports = mongoose.model('education',educationSchema)