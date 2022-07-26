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
        required: true,
        default: null
    }   
})

module.exports = mongoose.model('chat_groups',chatGroupSchema)