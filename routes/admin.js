 const express = require("express");
 const router = express.Router()
 const Admin = require('../models/admin')
 const Theme = require('../models/theme_setting')
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


router.post('/save/theme', async(req,res) => {
	const theme = new Theme({
        themeName: req.body.themeName,
        primaryColor: req.body.primaryColor,
        secondaryColor: req.body.secondaryColor,
		textColor: req.body.textColor
    })

    try{
		if (!(theme.themeName && theme.primaryColor  && theme.secondaryColor  && theme.textColor)) { 
			jsonObj = []
			if(!(theme.themeName)) {
				var item = {
					'key' : 'Theme Name',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(theme.primaryColor)) {
				var item = {
					'key' : 'Primary Color',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(theme.secondaryColor)) {
				var item = {
					'key' : 'Secondary Color',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(theme.textColor)) {
				var item = {
					'key' : 'Text Color',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			response = webResponse(406, false, jsonObj) 
		    res.send(response)
		    return;
		}
		
		if(req.body.id) {
			const themeDetails = await Theme.findById(req.body.id) 	
			themeDetails.themeColor= req.body.themecolor,
			themeDetails.primaryColor= req.body.primaryColor,
			themeDetails.secondaryColor= req.body.secondaryColor,
			themeDetails.textColor= req.body.textColor,
			await themeDetails.save()
			response = webResponse(200, true, "Theme Updated")  
			res.send(response)
			return "";
		} else{
			await theme.save() 
			response = webResponse(200, true, "Theme Saved")  
			res.send(response)
			return "";
		}
       
    }catch(err){
		response = webResponse(403, false, err)  
	    res.send(response)
		return "";
    }
})
 module.exports = router