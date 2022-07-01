 const express = require("express");
 const router = express.Router()
 const Admin = require('../models/admin')
 const md5 = require('md5');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
require('../functions')
 

router.post('/login', async(req,res) => {
	try { 
		const email = req.body.email
		const password = req.body.password
		
		// Validate user input
		
		if (!(email && password)) { 
			jsonObj = []
			if(!(email)) {
				var item = {
					'key' : 'email',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(password)) {
				var item = {
					'key' : 'password',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			
		  response = webResponse(406, false, jsonObj) 
		  res.send(response)
		}
	   const admin = await Admin.findOne({ email });

		if (admin && (await bcrypt.compare(password, admin.password))) {
		  // Create token
		  const token = jwt.sign(
			{ user_id: admin._id, email },
			process.env.JWT_SECRET,
			{
			  expiresIn: "9999 years",
			}
		  );

		  // save user token
		  admin.token = token; 
		  const result = {};
          result.access_token = 'Bearer '+token
		  result.admin = admin
		  
		  response = webResponse(202, true, result)  
	      res.send(response)
		} 
		 response = webResponse(200, false, "Invalid credentials")  
	      res.send(response)
	} catch (err) {
    console.log(err);
  }
})

 module.exports = router