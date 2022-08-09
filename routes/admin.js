 const express = require("express");
 const router = express.Router()
 const Admin = require('../models/admin')
 const Theme = require('../models/theme_setting')
 const md5 = require('md5');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 const Organization = require('../models/organization')
require('../functions')
 

router.put('/organization/update/:id', async(req,res) => {
    try{ 
        const organization = await Organization.findById(req.params.id) 	 
		organization.logo = req.body.logo
        organization.themecode = req.body.themecode
        const a1 = await organization.save()
        response = webResponse(202, true, a1)  
	    res.send(response)
    }catch(err){ console.log(err)
        res.send(err)
        //res.json(err)
    }
})

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
          result.access_token = token
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


router.post('/forgot', async(req,res) => {
	try { 
		const email = req.body.email
				
		// Validate user input
		
		if (!(email)) { 
			jsonObj = []
			if(!(email)) {
				var item = {
					'key' : 'email',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
						
		  response = webResponse(406, false, jsonObj) 
		  res.send(response)
		}
	   const admin = await Admin.findOne({ email });

		if (admin) {
			var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			var passwordLength = 10;
			var password = "";
			for (var i = 0; i <= passwordLength; i++) {
				var randomNumber = Math.floor(Math.random() * chars.length);
				password += chars.substring(randomNumber, randomNumber +1);
			}
			admin.password = bcrypt.hashSync(password, 12)
			result = await admin.save()
			let emailContent = "Your new password is "+password;
			let subject = 'Admin Forgot Password'
			sendEmail(req.body.email, subject, emailContent)
		}
		else
		{
			result = "false"
		}
		response = webResponse(202, true, result)  
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