const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    /*employeeId: {
        type: String,
        required: true,
		default: null
    },*/

	employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
   
    groupId: {
        type: String,
        required: false,
        default: null
    },
	
	sentTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false,
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
	
	appTempId:{
		type: String,
		required: true,
        default: null
	},
	
	dateTime:{
		type: String,
        default: null
	}
   
})

module.exports = mongoose.model('chat',chatSchema)