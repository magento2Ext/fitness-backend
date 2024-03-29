const mongoose = require('mongoose')


const videoSchema = new mongoose.Schema({
	auth_user_id: {
        type: String,
        required: true,
		default: null
    },

    userType: {
        type: String,
        required: true,
		default: null
    },
	
    name: {
        type: String,
        required: true,
		default: null
    },
   
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
	
    video_duration: {
        type: String,
        required: true,
        default: null
    },
   
})

module.exports = mongoose.model('motivational_videos',videoSchema)