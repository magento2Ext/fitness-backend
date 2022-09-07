 const express = require("express");
 const router = express.Router()
 const Employee = require('../models/employee')
 const Organization = require('../models/organization')
 const Theme = require('../models/theme_setting')
 const EmpStepTarget = require('../models/employee_step_target')
 const md5 = require('md5');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 const auth = require("../middleware/auth");
 const dateLib = require('date-and-time')
 var ObjectID = require('mongodb').ObjectID;
 const ChatGroup = require('../models/chat_group')
 const SubModule = require('../models/sub_module')
 const organizationRequests = require('../models/orgRequests')
require('../functions')
 
 router.post('/submodule/list', auth, async(req,res) => {
    try{

		const moduleId = req.body.moduleId
		// Validate user input
		if(!(moduleId)) {
			jsonObj = []
			var item = {
				'key' : 'ModuleId ',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}

		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId)
		
		if(employeeDetails.employeeType && employeeDetails.employeeType == "Coorporate") {
			const orgDetails = await Organization.findById(employeeDetails.organizationId);
			if (orgDetails) {  
				var subModuleIds = orgDetails.subModule_id
				var ids = []
				if(subModuleIds != "") {
					ids = subModuleIds.split(",")
				}  
				
				var subModules = []
				if(ids.length > 0) { 
					subModules = await SubModule.find({'moduleId':moduleId,'_id':{'$in': ids}})
				}
			} else{
				response = webResponse(200, false, 'Organization not found')  
				res.send(response)
				return;
			}
		} else {
			var employees = await Employee.find({employeeType:"Individual"})
			var subModules = await SubModule.find({"moduleId":req.body.moduleId})
		} 

		
		response = webResponse(201, true, subModules)  
		res.send(response)		
		return;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
 })

 router.post('/set/target', auth, async(req,res) => { 
    try{ 
	    var empId = req.user.user_id;
		var today =  dateLib.format(new Date(),'YYYY-MM-DD');
		
		const empStepTarget = new EmpStepTarget({
			employeeId: empId,
			step_target: req.body.step_target,
			date: today,
			type: req.body.type
		})
		
		const empStepTargetDetails = await EmpStepTarget.findOne({ date: today,  employeeId: req.user.user_id});
		
		if (empStepTargetDetails) {  
			empStepTargetDetails.step_target =  req.body.step_target
			empStepTargetDetails.type =  req.body.type
			const a1 = await empStepTargetDetails.save()
			response = webResponse(200, true, "Target added")  
			res.send(response);
			return;
		} else{
			const a1 = await empStepTarget.save()
			response = webResponse(200, true, "Target added")  
			res.send(response);
			return;
		}		
    }catch(err){ 
		console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})
 
router.post('/list', auth, async(req,res) => {
    try{
		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId);
		console.log('employeeDetails', employeeDetails)
		if(employeeDetails.organizationId) {
			var employees = await Employee.find({organizationId: employeeDetails.organizationId, _id: {$ne: empId}})
		} else {
			var employees = await Employee.find({organizationId: false, _id: {$ne: empId}})
		}
        response = webResponse(201, true, employees)  
		res.send(response)
			return "";
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again.")  
		res.send(response)
		return "";
    }
})

router.post('/web/list', async(req,res) => { 
    try{
		const employee = await Employee.find()
		if(employee)
		{
			var employeeList = [];
			for(i=0;i<employee.length;i++)
			{
				
				var OrgId = employee[i].organizationId
				if(OrgId != 'false')
				{
					var Orgdetail = await Organization.findById(OrgId)
					if(Orgdetail) {
						OrgName = Orgdetail.organizationName;
						
						employeedata = {
							'id' :  employee[i]._id,
							"firstName": employee[i].firstName,
							"lastName": employee[i].lastName,
							"email": employee[i].email,
							"userName": employee[i].userName,
							"zipCode":employee[i].zipCode,
							"employeeType": employee[i].employeeType,
							"is_exclusive": employee[i].is_exclusive,
							"org_name": OrgName,
						}
						employeeList.push(employeedata);
					}					
				}
				else
				{
					employeedata = {
							'id' :  employee[i]._id,
							"firstName": employee[i].firstName,
							"lastName": employee[i].lastName,
							"email": employee[i].email,
							"userName": employee[i].userName,
							"zipCode":employee[i].zipCode,
							"employeeType": employee[i].employeeType,
							"is_exclusive": employee[i].is_exclusive,
							"org_name": 'N/A',
						}
						employeeList.push(employeedata);
				} 
			}
		}
		
        response = webResponse(201, true, employeeList)  
		res.send(response)		
		return;;
    }catch(err){
		console.log()
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.get('/list/:id/:type', async(req,res) => { 
    try{
		let data = [];
        if(req.params.type == 'admin'){
			 data = await Employee.find();
			 res.json(data);
		}else{
			 data = await Employee.find({userOrganizations: {$in: [req.params.id]}});
			 res.json(data);
		}
		
    }catch(err){
        res.send('Error ' + err)
    }
})

router.get('/orgRequests/:id', async(req,res) => { 
    try{

		 let data = await organizationRequests.find({orgId: req.params.id, status: "0"});

		 if(data.length != 0){

			let userArray = [];
			let count = 0;

			data.forEach( async(e) => {

			let emp = await Employee.findOne({_id: e.employeeId});

			if(emp!=null){
				let dict =     {
					"_id": emp._id,
					"firstName": emp.firstName,
					"lastName": emp.lastName,
					"email": emp.email,
					"userName": emp.userName,
					"zipCode": emp.zipCode,
					"employeeType": emp.employeeType,
					"is_exclusive": emp.is_exclusive,
					"referCode":emp.referCode,
					"organizationId": emp.organizationId,
					"isVerified": e.status,
					"picture": emp.picture,
					"reqId": e._id
				}
				userArray.push(dict);
			}

			count++;
			if(count === data.length){
				res.json(userArray);
			}
			
			})
			

		 }else{
			res.json([]);
		 }
 

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
        
		let newPassword  = await bcrypt.hashSync(req.body.password, 12);
        const employee = await Employee.updateOne({ email: req.body.email.toLowerCase() }, {$set: {password: newPassword}}, {new: true});
		if(employee){
			response = webResponse(200, true, "Password Updated")  
			res.send(response)
		}else{
			response = webResponse(200, false, "Password Not Updated")  
			res.send(response)
		}
    }catch(err){
        res.send('Error ' + err)
    }
})
 
 router.post('/save', async(req,res) => {
	try{ 
		let todayDate = new Date();
		console.log('td', dateLib.format(todayDate,'YYYY-MM-DD'))
		const employee = new Employee({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email.toLowerCase(),
			userName: req.body.userName,
			password: req.body.password,
			employeeType: 'Individual',
			isVerified: true,
			date: dateLib.format(todayDate,'YYYY-MM-DD')
			/* zipCode: req.body.zipCode,
			referCode: req.body.referCode,
			employeeType: req.body.employeeType */
		})
		
		if (!(employee.firstName && employee.lastName && employee.email && employee.userName && employee.password)) { 
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
			/*if(!(employee.zipCode)) {
				var item = {
					'key' : 'Zipcode',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}*/
			/* if(!(employee.referCode)) {
				var item = {
					'key' : 'Refercode',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			} */
			
			/* if(!(employee.employeeType)) {
				var item = {
					'key' : 'EmployeeType',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			} */
			
		    response = webResponse(406, false, jsonObj) 
		    res.send(response)
		  return;
		}
	
		const employeeEmailExist = await Employee.findOne({ email: req.body.email.toLowerCase() });
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
		
		/* if(req.body.employeeType && (req.body.employeeType == "Coorporate" || req.body.employeeType == "coorporate" )) { 
			employee.isVerified = "false"
		} else {
			employee.isVerified = "true"
		} */
		// employee.isVerified = "false"
		if(req.body.password) {
			employee.password = await bcrypt.hashSync(req.body.password, 12)
		}
		if(!req.body.otp) {
			let otp = Math.floor(1000 + Math.random() * 9000);
			employee.otp = otp;
		}
		
		/* if(req.body.is_exclusive) {
			employee.is_exclusive = req.body.is_exclusive
		} */
		
		/* if(req.body.zipCode) {
			employee.zipCode = req.body.zipCode
		} */
		/* if(req.body.referCode) {
			
			const orgDetails = await Organization.findOne({ referCode: req.body.referCode });
			if (orgDetails) {  

				employee.organizationId = orgDetails.id
			} else{
				response = webResponse(200, false, 'Invalid refer code')  
				res.send(response)
				return;
			}
		} */
		
		if(!req.body.otp) {
			let otp = Math.floor(1000 + Math.random() * 9000);
			employee.otp = otp;
			let emailContent = "OTP is "+otp;
			let subject = 'Account Verification OTP '
			sendEmail(req.body.email.toLowerCase(), subject, emailContent)
			
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
 
			/* if(req.body.employeeType && (req.body.employeeType == "Coorporate" || req.body.employeeType == "coorporate" )) { 
				var orgId = a1.organizationId
				const chatGroup = await ChatGroup.findOne( {'organizationId': orgId, 'is_default': 1} )
				if(chatGroup != null) {
					var userArray = chatGroup.users

					userArray.push(a1.id); 
					chatGroup.users = userArray
					chatGroup.save();
				}
		
			} */

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


router.post('/sendOtpAgain', async (req, res) => {
        
	    const employeeEmailExist = await Employee.findOne({ email: req.body.email.toLowerCase() });
		if(employeeEmailExist != null){
			let otp = Math.floor(1000 + Math.random() * 9000);
			await Employee.updateOne({ email: req.body.email.toLowerCase()}, {$set: {otp: otp}});
			let emailContent = "OTP is "+otp;
			let subject = 'Account Verification OTP '
			sendEmail(req.body.email.toLowerCase(), subject, emailContent)
			const result = {};
			result.message = "OTP sent"
			
			response = webResponse(202, true, result)  
			res.send(response)
			return;
		}else{
			response = webResponse(200, true, "User not found.")  
			res.send(response)
		}
})

 
router.get('/detail/:id', async(req,res) => {
    try{
           const employee = await Employee.findById(req.body.id)
		   res.json(employee)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.delete('/delete', async(req,res) => {
    try{
        const id = req.body.id
		// Validate user input
		if(!(id)) {
			jsonObj = []
			var item = {
				'key' : 'Employee id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const employee = await Employee.findById(req.body.id)
		if(!employee) {
			response = webResponse(404, false, "Employee not found") 
			res.send(response)
			return "";
		}
		
		const _id = new ObjectID(req.body.id);
		await Employee.deleteOne( {'_id':_id})
		  
		//employee.deleteOne(req.body.id)
		response = webResponse(200, true, "Employee deleted") 
		res.send(response)
		return "";
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
		const email = req.body.email.toLowerCase()
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

	   if(employee == null){
				response = webResponse(200, false, "Account not found.")  
				res.send(response)
				return;
	   }


		if (await bcrypt.compare(password, employee.password)) {
			 
			if(employee.isVerified == false && employee.userOrganizations.length == 0) {
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
			let logo;
			if(employee.organizationId && employee.organizationId != 'false') {
			    const organization = await Organization.findById(employee.organizationId)
			    result.organization = organization
				var themecode = organization.themecode
				logo = organization.logo
				if(organization != null && organization.themecode != null) {
				   appData = await Theme.findById(organization.themecode)
			    }
			}else{
				 logo = process.env.ORGLOGO
			}
			if(appData == null) {
				appData = await Theme.findOne()
			}
 
			
			result.appData = appData
		    result.logo = logo
		  
		    response = webResponse(202, true, result)  
	        res.send(response)
		    return;
		}else{
			response = webResponse(200, false, "Invalid credentials")  
			res.send(response)
			return;
		} 

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


router.put('/update/:id', async(req,res) => {

	 try{

		let data = {}

		if(req.body.requestType == 'removeFromOrg'){
			data['organizationId'] = false;
			data['isVerified'] = false;
			data['is_exclusive'] = false;
			data['userOrganizations'] = [];
			await Employee.updateOne({_id: req.body.id}, {$set: data}, {new: true}); 
		}else{
			data = {
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				zipCode: req.body.zipCode,
				is_exclusive: req.body.is_exclusive
			}
 
			await Employee.updateOne({_id: req.body.id}, {$set: data}, {new: true}); 
		}

		setTimeout(async () => {

			const emp = await Employee.findOne({_id: req.body.id});
			let dict = {
				"_id": emp._id,
				"firstName": emp.firstName,
				"lastName": emp.lastName,
				"email": emp.email,
				"userName": emp.userName,
				"is_exclusive": emp.is_exclusive,
				"organizationId": emp.organizationId,
				"picture": emp.picture
			}

			response = webResponse(202, true, dict);
			res.send(response);
			
		}, 2000);
 


    }catch(err){
		console.log('err', err)
        res.send(err)
        
    }

})


router.post('/orgRequestAction', async(req,res) => {

	try{

		
        const reqId = req.body.reqId;
		const reqDetails = await organizationRequests.findOne({_id: reqId});
		console.log('reqDetails', reqDetails)
		const employeeId = reqDetails.employeeId;
		const orgId = reqDetails.orgId;
	
		const empDetails = await Employee.findOne({_id: employeeId});

		if(empDetails.userOrganizations.length >= 1){
			res.send('User is already a member of an organization');
			return;
		}

	   if(req.body.status == '1') {
		let orgData = await Organization.findOne({_id: orgId});

		let data = {
			is_exclusive: true,
			isVerified: req.body.status,
			organizationId: orgId
		}

		await Employee.updateOne({_id: employeeId}, {$set: data, $push: {userOrganizations: orgId}}, {new: true}); 

		await ChatGroup.updateOne({organization_id: String(orgId)}, {$push: {users: String(employeeId)}});

		await organizationRequests.deleteMany({employeeId: reqDetails.employeeId});

		let emailContent = "Congratulations! "+ orgData.organizationName + " has approved you as its member";
		let subject = 'Organization approval'
		sendEmail(empDetails.email, subject, emailContent);

		response = webResponse(202, true, 'Success');
		res.send(response);
	   }else{

		await organizationRequests.updateOne({_id: reqId}, {$set: {status: req.body.status}});
		response = webResponse(202, true, 'Success');
		res.send(response);

	   }
	
   }catch(err){
	   console.log('err', err)
	   res.send(err)
   }

})


router.post('/updateVisit', auth, async(req,res)=> {

	try{
		
		let empId = req.user.user_id;
		let query = {};
	
		if(req.body.type == 'disclaimer') query = {$set: {seenDisclaimer: true}}
		if(req.body.type == 'guide') query = {$set: {seenGuide: true}}
		
          await Employee.updateOne({_id: empId}, query, {new: true});

		  setTimeout(async () => {
			let result =  await Employee.findOne({_id: empId});
			console.log('empId', empId, result);
			response = webResponse(202, true, result);
			res.send(response);
			
		  }, 2000);
	
   }catch(err){
	   console.log('err', err)
	   res.send(err)
	   
   }

})


router.post('/testUpdate', async(req,res)=> {

	try{
		
		let result = await Employee.updateMany({}, {$set: {picture: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png"}}, {new: true});
		res.send(result)
   }catch(err){
	   console.log('err', err)
	   res.send(err)
	   
   }

});


router.post('/getProfile', auth, async(req,res) => {
	try { 
    
		var empId = req.user.user_id;
		const employee = await Employee.findById(empId);

		if(employee != null){

			// save user token
			const result = {};
			result.employee = employee
			var appData = null;
			let logo;
			if(employee.organizationId && employee.organizationId != 'false') {
				const organization = await Organization.findById(employee.organizationId)
				result.organization = organization
				var themecode = organization.themecode
				logo = organization.logo
				if(organization != null && organization.themecode != null) {
					appData = await Theme.findById(organization.themecode)
				}
			}else{
					logo = process.env.ORGLOGO
			}
			if(appData == null) {
				appData = await Theme.findOne()
			}
	
			
			result.appData = appData
			result.logo = logo
			
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
		
	});


	router.post('/updateEmployee', auth, async(req,res) => {

		try{
			var empId = req.user.user_id;
			const emailExist = await Employee.findOne({email: req.body.email, _id: {$ne: empId}});
			
			const usernameExist = await Employee.findOne({userName: req.body.userName, _id: {$ne: empId}});
			
			if(emailExist != null || usernameExist != null){
				let msg = emailExist != null ? 'Email already in use.' : 'Username already in use.'
				response = webResponse(200, false, msg)  
				res.send(response)
				return;
			}
			
			let data = {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			userName: req.body.userName,
			picture: req.body.picture,
			height: req.body.height,
			heightType: req.body.heightType
			}
			
		    await Employee.updateOne({_id: empId}, {$set: data}, {new: true}); 

			setTimeout(async () => {
			const employee = await Employee.findById(empId);
			const result = {};
			result.employee = employee
			var appData = null;
			let logo;
			if(employee.organizationId && employee.organizationId != 'false') {
				const organization = await Organization.findById(employee.organizationId)
				result.organization = organization
				var themecode = organization.themecode
				logo = organization.logo
				if(organization != null && organization.themecode != null) {
					appData = await Theme.findById(organization.themecode)
				}
			}else{
					logo = process.env.ORGLOGO
			}
			if(appData == null) {
				appData = await Theme.findOne()
			}
	
			
			result.appData = appData
			result.logo = logo
			
			response = webResponse(202, true, result)  
			res.send(response)
			return;
				
			}, 1000);
 
   

	   }catch(err){
		   console.log('err', err)
		   res.send(err)
		   
	   }
   
   })

 module.exports = router