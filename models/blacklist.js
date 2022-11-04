const mongoose = require('mongoose')


const blacklistSchema = new mongoose.Schema({

    token: {
        type: String,
        required: true,
		default: null
    }   
})

module.exports = mongoose.model('Blacklist', blacklistSchema)