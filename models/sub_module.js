const mongoose = require('mongoose')


const subModuleSchema = new mongoose.Schema({

	moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
    },
	
    name: {
        type: String,
        required: true,
        default: null
    },
   
    image: {
        type: String,
        required: true,
        default: null
    }
   
})

module.exports = mongoose.model('sub_modules',subModuleSchema)