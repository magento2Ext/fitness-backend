const mongoose = require('mongoose')


const organizationRequestsSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
		default: null
    },
    employeeId: {
        type: String,
        required: true,
		default: null
    },
    status: {
        type: String,
        default: 0
    },
})
  
module.exports = mongoose.model('organizationRequests',organizationRequestsSchema)