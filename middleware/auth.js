const jwt = require("jsonwebtoken");
require("dotenv").config();
const config = process.env;
const Employee = require('../models/employee')
const Organization = require('../models/organization')
const Admin = require('../models/admin')

const verifyToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["authorization"];
  console.log(token)
  if (!token) {
	response = webResponse(401, false, "A token is required for authentication")  
	res.send(response)
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
	var empId = req.user.user_id;
	let type =  req.user.type;
	let table = {};

	if(type === 'admin') table = Admin;
	if(type === 'org') table = Organization;
	if(type === 'employee') table = Employee;

	const USER = table.findById(empId)
	if(!USER){
			response = webResponse(404, false, "USER not found.")  
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