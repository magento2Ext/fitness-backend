 const express = require("express");
 const router = express.Router()
 const Admin = require('../models/admin')
 const Theme = require('../models/theme_setting')
 const md5 = require('md5');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');


 const Organization = require('../models/organization')
 const Challenge = require('../models/challenge')
 const Employee = require('../models/employee');
 const Audio = require('../models/teacher_audio')
 const EducationModule = require('../models/education')
 const TeacherCats = require('../models/teacher_categories')

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

	   if(admin == null){
		response = webResponse(200, false, "Account not found.")  
	    res.send(response);
		return;
	   }


		if (await bcrypt.compare(password, admin.password)) {
		  // Create token
		  const token = jwt.sign(
			{ user_id: admin._id, email, type: 'admin' },
			process.env.JWT_SECRET,
			{
			  expiresIn: "9999 years",
			}
		  );

		  // save user token
		  let userData = {...admin.toObject(), token: token, panelType: 'admin', role: 1}
		  const result = {};
          result.access_token = token
		  result.admin = admin

		  result.userData = userData
		  response = webResponse(202, true, result)  
	      res.send(response);
		  return;
		}else{
			response = webResponse(200, false, "Invalid password.")  
			res.send(response);
			return;
		} 
 
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
			sendEmail(req.body.email, subject, emailContent);

			response = webResponse(202, true, result)  
			res.send(response)
		}
		else
		{
			response = webResponse(200, false, "Invalid email.")  
			res.send(response);
			return;
		}

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


router.post('/getProfile', async(req,res) => {
	try { 
    
		const {id, type} = req.body;
		// Validate user input
		if(!(id && type)) {

			jsonObj = []
			if(!(id)) {
				var item = {
					'key' : 'id',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}

			if(!(type)) {
				var item = {
					'key' : 'type',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}

			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}

		const table = req.body.type === 'admin' ? Admin : Organization ;
	    const organization = await table.findById(req.body.id);

		if(organization != null){

			const token = jwt.sign(
				{ user_id: organization._id, email: organization.email, type: req.body.type === 'admin' ? 'admin': 'org'},
				process.env.JWT_SECRET,
				{
				  expiresIn: "9999 years",
				}
			  );
	
			  // save user token
			  organization.token = token; 
			  const result = {};
			  result.access_token = token
			  result.organization = organization
			  
			  response = webResponse(202, true, result)  
			  res.send(response)
			  return;

		}else{

			response = webResponse(200, false, "User not found.")  
			res.send(response);
			return;
		}
		}catch(err){
			response = webResponse(403, false, err)  
			res.send(response)
			return "";
		}
		
	})


	router.post('/dashboardData', async (req,res) => {
		try { 
	        const id = req.body.id;
			const OrganizationCount = await Organization.count();
			const ChallengeCount = await Challenge.count({userId: id});
			const EmployeeCount = await  Employee.count({organizationId: id, status: 1});
			const MindCount = await Audio.count({userId: id, postType: {$in: ['mind_daily_videos', 'mind_music']}});
			const SoulCount = await Audio.count({userId: id, postType: {$in: ['meditation', 'yoga', 'soul_daily_video']}});
			const EducationModuleCount = await EducationModule.count({auth_user_id: id});
			const TeacherCatsCount = await TeacherCats.count({userId: id});

			let data = [
				{count: OrganizationCount, type: 'org'},
				{count: ChallengeCount, type: 'challenge'},
				{count: EmployeeCount, type: 'emp'},
				{count: MindCount, type: 'mind'},
				{count: SoulCount, type: 'soul'},
				{count: EducationModuleCount, type: 'education'},
				{count: TeacherCatsCount, type: 'teacher'},
			]
		 

			res.send(data)
			return;
 
	
 
			}catch(err){
				response = webResponse(403, false, err)  
				res.send(response)
				return "";
			}
			
		})

 module.exports = router