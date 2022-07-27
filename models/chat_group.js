const mongoose = require('mongoose')

const chatGroupSchema = new mongoose.Schema({

    group_name: {
        type: String,
        required: true,
		default: null
    },
   
    group_picture: {
        type: String,
        required: true,
        default: null
    },
   
    challenge: {
        type: String,
        required: true,
        default: null
    },
   
    users: {
        type: Array,
        default: null
    },
   
    chat_group_requested_users: {
        type: Array,
        default: null
    },
   
    group_admin: {
        type: String,
        default: null
    },
   
    organization_id: {
        type: String,
        default: null
    },
	
	is_default: {
		type: Boolean,
		default: false
	}
})

module.exports = mongoose.model('chat_groups',chatGroupSchema)