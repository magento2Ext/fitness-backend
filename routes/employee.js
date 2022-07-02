 const express = require("express");
 const router = express.Router()
 const Employee = require('../models/employee')
 const Organization = require('../models/organization')
 const md5 = require('md5');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 
require('../functions')
 
 router.get('/list', async(req,res) => {
    try{
		const aliens = await Employee.find()
        res.json(aliens)
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
		} else {
			response = webResponse(200, false, "Email not found")  
			res.send(response)
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
		}
	   const employee = await Employee.findOne({ email });

		if (employee && (await bcrypt.compare(password, employee.password))) {
		  // Create token
		  const token = jwt.sign(
			{ user_id: employee._id, email },
			process.env.JWT_SECRET,
			{
			  expiresIn: "9999 years",
			}
		  );
         const organization = await Organization.findById(employee.organizationId)
		  // save user token
		  employee.token = token; 
		  const result = {};
          result.access_token = token
		  result.employee = employee
		  result.organization = organization
		  
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