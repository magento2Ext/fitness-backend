const mongoose = require('mongoose')


const themeSchema = new mongoose.Schema({

    primaryColor: {
        type: String,
        required: true,
		default: null
    },
   
    secondaryColor: {
        type: String,
        required: true,
        default: null
    },
    textColor: {
        type: String,
        required: true,
        default: null
    },
   
})

module.exports = mongoose.model('themeSetting',themeSchema)