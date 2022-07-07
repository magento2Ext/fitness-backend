const mongoose = require('mongoose')


const moduleSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        default: null
    },
   
    image: {
        type: String,
        required: true,
        default: null
    },
   
   
   
})

module.exports = mongoose.model('modules',moduleSchema)