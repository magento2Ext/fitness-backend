const mongoose = require('mongoose')

const userChatNodeSchema = new mongoose.Schema({
    users: {
        type: Array,
        default: null
    },
	
    node: {
        type: String,
        required: true,
        default: null
    }   
})

module.exports = mongoose.model('user_chat_nodes',userChatNodeSchema)