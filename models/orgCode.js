const mongoose = require('mongoose')


const organizationCodeSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
		default: null
    },
    code: {
        type: String,
        required: true,
		default: null
    },
    status: {
        type: String,
        default: 1
    },
})
  
module.exports = mongoose.model('organizationCode',organizationCodeSchema)