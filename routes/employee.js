 const express = require("express");
 const router = express.Router()
 const Employee = require('../models/employee')
 const Organization = require('../models/organization')
 const Theme = require('../models/theme_setting')
 const md5 = require('md5');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 
require('../functions')
 
 router.get('/list', async(req,res) => {
    try{
		const aliens = await Employee.find()
        res.json(aliens)
		return '';
    }catch(err){
        res.send('Error ' + err)
    }
})

router.get('/list/:id', async(req,res) => { 
    try{
           const employeedd = await Employee.find({organizationId:req.params.id})
		   res.json(employeedd)
    }catch(err){
        res.send('Error ' + err)
    }
})
 
router.post('/forget/password', async(req,res) => {
    try{ 
        const employeeExist = await Employee.findOne({ email: req.body.email });
		if(employeeExist) {
			let otp = Math.floor(1000 + Math.random() * 9000);
			let emailContent = "OTP is "+otp;
			let subject = 'Forgot password OTP '
			sendEmail(req.body.email, subject, emailContent)
				
			const result = {};
			result.otp = otp
			result.employee = employeeExist
			result.message = "OTP sent"
			response = webResponse(202, true, result)  
			res.send(response)
			return "";
		} else {
			response = webResponse(200, false, "Email not found")  
			res.send(response)
			return "";
		}
		
    }catch(err){
        res.send('Error ' + err)
    }
})


router.post('/reset/password', async(req,res) => {
    try{
        const employee = await Employee.findOne({ email: req.body.email });
		
		employee.password = req.body.password
        const a1 = await employee.save()
        response = webResponse(200, true, "Password Updated")  
	    res.send(response)
    }catch(err){
        res.send('Error ' + err)
    }
})
 
 router.post('/save', async(req,res) => {
	try{ 
		const employee = new Employee({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			userName: req.body.userName,
			password: req.body.password,
			zipCode: req.body.zipCode,
			referCode: req.body.referCode,
			employeeType: req.body.employeeType
		})
		
		if (!(employee.firstName && employee.lastName && employee.email && employee.userName && employee.zipCode && employee.referCode && employee.employeeType && employee.password)) { 
			jsonObj = []
			if(!(employee.firstName)) {
				var item = {
					'key' : 'Firstname',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(employee.lastName)) {
				var item = {
					'key' : 'Lastname',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(employee.email)) {
				var item = {
					'key' : 'email',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(employee.password)) {
				var item = {
					'key' : 'password',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(employee.userName)) {
				var item = {
					'key' : 'Username',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(employee.zipCode)) {
				var item = {
					'key' : 'Zipcode',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			if(!(employee.referCode)) {
				var item = {
					'key' : 'Refercode',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			
			if(!(employee.employeeType)) {
				var item = {
					'key' : 'EmployeeType',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}
			
		  response = webResponse(406, false, jsonObj) 
		  res.send(response)
		  return;
		}
	
		const employeeEmailExist = await Employee.findOne({ email: req.body.email });
		if (employeeEmailExist && employeeEmailExist != null) {  
			response = webResponse(200, false, 'Email already exist')  
			res.send(response)
			return;
		}
		
		const employeeUsernameExist = await Employee.findOne({ userName: req.body.userName });
		if (employeeUsernameExist && employeeUsernameExist != null) {  
			response = webResponse(200, false, 'Username already exist');
			res.json(response)
			return;
		}
		
		if(req.body.employeeType && (req.body.employeeType == "Coorporate" || req.body.employeeType == "coorporate" )) { 
			employee.isVerified = "false"
		} else {
			employee.isVerified = "true"
		}
		
		if(req.body.password) {
			employee.password = await bcrypt.hashSync(req.body.password, 12)
		}
		if(!req.body.otp) {
			let otp = Math.floor(1000 + Math.random() * 9000);
			employee.otp = otp;
		}
		
		if(req.body.is_exclusive) {
			employee.is_exclusive = req.body.is_exclusive
		}
		if(req.body.referCode) {
			
			const orgDetails = await Organization.findOne({ referCode: req.body.referCode });
			if (orgDetails) {  
				employee.organizationId = orgDetails.id
			} else{
				response = webResponse(200, false, 'Invalid refer code')  
				res.send(response)
				return;
			}
		}
		
		if(!req.body.otp) {
			let otp = Math.floor(1000 + Math.random() * 9000);
			employee.otp = otp;
			let emailContent = "OTP is "+otp;
			let subject = 'Register OTP '
			sendEmail(req.body.email, subject, emailContent)
			
			const result = {};
			result.otp = otp
			result.employee = employee
		    result.message = "OTP sent"
		    
			response = webResponse(202, true, result)  
	        res.send(response)
			return;
		}  else {
			employee.otp = req.body.otp;
			const a1 =  await employee.save() 
			response = webResponse(202, true, a1)  
			res.send(response)		
			return;
		}
		
    }catch(err){  console.log(err)
		//res.send('Error ' + err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

 
router.get('/detail/:id', async(req,res) => {
    try{
           const employee = await Employee.findById(req.params.id)
		   res.json(employee)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.post('/profile', async(req,res) => {
    try{
        const token = req.get('Authorization');
		const verified = jwt.verify(token, process.env.JWT_SECRET);
        if(verified){
            return res.send("Successfully Verified");
        }else{
            // Access Denied 
			return res.status(401).send(error);
        }
    }catch(err){
        res.send('Error ' + err)
    }
})

router.post('/login', async(req,res) => {
	try { 
	 //res.json(req)
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
		  return;
		}
	   const employee = await Employee.findOne({ email });


		if (employee && (await bcrypt.compare(password, employee.password))) {
			 
			if(employee.isVerified == false ) {
				response = webResponse(200, false, "User not verified")  
				res.send(response)
				return;
			}
			
		  // Create token
		  const token = jwt.sign(
			{ user_id: employee._id, email },
			process.env.JWT_SECRET,
			{
			  expiresIn: "9999 years",
			}
		  );
		  
		 
		  // save user token
		    employee.token = token; 
			const result = {};
            result.access_token = token
			result.employee = employee
			var appData = null;
			if(employee.organizationId && employee.organizationId != 'false') {
			    const organization = await Organization.findById(employee.organizationId)
			    result.organization = organization
			    if(organization != null && organization.themeId != null) {
				   appData = await Theme.findById(organization.themecode)
			    }
			}
			if(appData == null) {
				appData = await Theme.findOne()
			}
			
			result.appData = appData
		    result.logo = organization.logo
		  
		    response = webResponse(202, true, result)  
	        res.send(response)
		    return;
		} 
		response = webResponse(200, false, "Invalid credentials")  
	      res.send(response)
		  return;
	} catch (err) {
		console.log(err);
    }
})

router.post('/verify',async(req,res)=> {
	 try{
		const id = req.body.id
		// Validate user input
		if (!(id )) { 
			jsonObj = []
			var item = {
				'key' : 'id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return;
		}
		
        const employee = await Employee.findById(req.body.id) 	 
		
		if(employee){
			employee.isVerified = true
			const a1 = await employee.save()
			response = webResponse(200, true, "Employee verified")  
			res.send(response)
			return;  
		} else {
			response = webResponse(200, false, "Employee not found")  
			  res.send(response)
			  return;
		}
		
    }catch(err){
       	response = webResponse(200, false, "Something went wrong")  
			  res.send(response)
			  return;
    }

})

router.patch('/update/:id',async(req,res)=> {
	 try{
        const employee = await Employee.findById(req.params.id) 
		
		employee.employeeName = req.body.employeeName,
        employee.logo = req.body.logo,
        employee.hexCode = req.body.hexCode,
        employee.email = req.body.email,
        employee.password = req.body.password,
        employee.zipCode = req.body.zipCode,
        employee.referCode = req.body.referCode,
        employee.modules = req.body.modules
        const a1 = await employee.save()
        res.json(a1)   
    }catch(err){
       // res.send(err)
        res.send('Error')
    }

})

 module.exports = router