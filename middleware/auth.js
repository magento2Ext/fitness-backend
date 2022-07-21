const jwt = require("jsonwebtoken");
require("dotenv").config();
const config = process.env;
const Employee = require('../models/employee')

const verifyToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["authorization"];
  if (!token) {
	response = webResponse(401, false, "A token is required for authentication")  
	res.send(response)
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
	var empId = req.user.user_id;
	const employee = Employee.findById(empId)
	if(!employee){
			response = webResponse(404, false, "Employee not found.")  
			res.send(response)
			return;
	}
  } catch (err) {
	response = webResponse(401, false, "Invalid Token")  
	res.send(response)
	return;
  }
  return next();
};

module.exports = verifyToken;