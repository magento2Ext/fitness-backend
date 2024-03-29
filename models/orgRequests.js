const { Timestamp } = require('bson')
const mongoose = require('mongoose')


const organizationRequestsSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
		default: null
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
		default: null
    },
    status: {
        type: String,
        default: 0
    },
}, {timestamps: true})
  
module.exports = mongoose.model('organizationRequests', organizationRequestsSchema)