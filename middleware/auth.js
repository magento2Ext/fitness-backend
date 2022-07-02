const jwt = require("jsonwebtoken");
require("dotenv").config();
const config = process.env;

const verifyToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["authorization"];
  if (!token) {
	response = webResponse(401, false, "A token is required for authentication")  
	res.send(response)
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
	response = webResponse(401, false, "Invalid Token")  
	res.send(response)
  }
  return next();
};

module.exports = verifyToken;