const mongoose = require('mongoose')


const chatSchema = new mongoose.Schema({

    employeeId: {
        type: String,
        required: true,
		default: null
    },
   
    groupId: {
        type: String,
        required: true,
        default: null
    },
	
    message: {
        type: String,
        required: true,
        default: null
    },
	
	deliveredTo:{
		type: Array,
        default: null
	},
	
	seenBy:{
		type: Array,
        default: null
	},
	
	dateTime:{
		type: String,
        default: new Date()
	}
   
})

module.exports = mongoose.model('chat',chatSchema)