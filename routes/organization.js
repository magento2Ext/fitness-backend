 const express = require("express");
 const router = express.Router()
 const Organization = require('../models/organization')
 const ChatGroup = require('../models/chat_group')
 const Employee = require('../models/employee')
 const Module = require('../models/module')
 const OrganizationCode = require('../models/orgCode')
 const Theme = require('../models/theme_setting')
 const organizationRequests = require('../models/orgRequests')
 const md5 = require('md5');
 const nodemailer = require('nodemailer');
 const size = process.env.RECORD_LIMIT
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 const auth = require("../middleware/auth");
 var ObjectID = require('mongodb').ObjectID;
 require('../functions')
 const sendFCM = require('./fcm');
 
 const admin=require('firebase-admin');
 var db=admin.database();
 var chatRef=db.ref("chat");

 router.get('/list', async(req,res) => {
	if(req.query.page) {
		var pageNo = parseInt(req.query.page)
	} else {
		var pageNo = 1;
	}
	
    try{
		 var query = {}
   
		query.skip = size * (pageNo - 1)
		query.limit = size 
		console.log(query)
		const totalRecords = await Organization.countDocuments().exec();
		
		var ModuleList =  await Module.find()
		var moduleArray = []
		
		ModuleList.forEach( function(moduleDetail){
			var obj = []
			var id = moduleDetail._id
			moduleArray[id] = moduleDetail.name;
		}) 
		
         Organization.find({},{},query,function(err,data) {
				if(err) {
					response = webResponse(200, false, "Error fetching data")  
					res.json(response);
				    return "";
				} else {
					const result = {}
					console.log(size)
					result.totalRecords =  totalRecords;
					result.rowsPerPage = size;
					result.pages = Math.ceil(totalRecords/size);
					
					var orgList = [];
					data.forEach( function(col){
						var modules = col.modules; 
						var moduleIds = modules.split(",")
						var moduleNames = ''
						var i = 0;
						moduleIds.forEach( function(modId){
							if(moduleArray[modId])  {
								if(i > 0) {
									moduleNames = moduleNames+ ',' + moduleArray[modId] 
								} else {
									moduleNames = moduleNames + moduleArray[modId] 
								}
							}
							i++;
						})
						orgDetail = {
							'_id' :  col._id,
							"organizationName": col.organizationName,
							"email": col.email,
							"password": col.password,
							"zipCode":col.zipCode,
							"referCode":col.referCode,
							"logo":col.logo,
							"themecode":col.themecode,
							"modules":moduleNames,
							"module_id":col.module_id,
							"subModule_id":col.subModule_id,
							"status": col.status
						}
						orgList.push(orgDetail);
					})
					
					result.data = orgList;
					response = webResponse(202, true, result)  
					res.send(response);
				   return "";
				}				
			});
           
    }catch(err){ console.log(err)
        res.send('Error ' + err)
    }
})

router.post("/module/list", auth, async(req, res) => { 
  try{ 
		var empId = req.user.user_id;
		const employee = await Employee.findById(empId)
		console.log('employee', employee);
		if(!employee){
			response = webResponse(404, false, "Employee not found.")  
			res.send(response)
			return;
		}
		if(employee.userOrganizations.length > 0) {
			const org = await Organization.findById(employee.organizationId)
			if(org) {
				var modules = org.modules; 
				var ids = modules.split(",")
				var ModuleList = await Module.find({ _id : { $in : ids } })
			   // var ModuleList = await Module.find({ _id : { $in : ['62c697e764a3d1c9be8c7f15','62c6980964a3d1c9be8c7f18'] } })
				response = webResponse(201, true, ModuleList)  
				res.send(response)		
				return;
			} else{
				response = webResponse(404, false, "Organization not found")  
				res.send(response)
				return;
			}
		} else{
			const modulesAvailable = await Module.find()
			response = webResponse(201, true, modulesAvailable)  
			res.send(response)		
			return;
		}
	} catch(err){   console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
  
});
 
 router.post('/save', async(req,res) => {

	let doesExist = await Organization.findOne({email: req.body.email});
	var regex = new RegExp(["^", req.body.organizationName, "$"].join(""), "i");
	let nameExist = await Organization.find({organizationName: regex});
 

	if(doesExist != null) {
						resMessage = "An organization already exists with same email, Please choose another email";
						response = webResponse(200, false, resMessage)  
						res.send(response)		
						return;
     }

	 if(nameExist.length !== 0 ) {
		resMessage = "An organization already exists with same name, Please choose another name";
		response = webResponse(200, false, resMessage)  
		res.send(response)		
		return;
}

	let referCode = (Math.random() + 1).toString(36).substring(6);
	const organization = new Organization({
        organizationName: req.body.organizationName,
        email: req.body.email,
        zipCode: req.body.zipCode,
        referCode: referCode,
        modules: req.body.modules,
        module_id: req.body.modules,
		subModule_id: req.body.subModule_id,
		logo: process.env.ORGLOGO,
		themecode: '62c3de94a4db9348c847b5e1'
    })
	if(req.body.logo && req.body.logo != "") {
		organization.logo = req.body.logo
	}
	
	if(req.body.themecode && req.body.themecode != "") {
		organization.themecode = req.body.themecode
	}
	

    try{
		if(req.body.password) {
			organization.password = await bcrypt.hashSync(req.body.password, 12)
		}

        const a1 =  await organization.save() 
		
		
		let emailContent = "Organization Code is "+referCode;
		let subject = 'Organization Code'
		sendEmail(req.body.email, subject, emailContent)
		
		var modules = a1.modules; 
		var ids = modules.split(",")
		var ModuleList = await Module.find({ _id : { $in : ids } })
		
		var moduleNames = ''
		var i = 0;
		ModuleList.forEach(function(mod){
			if(i > 0) {
				moduleNames = moduleNames+ ',' + mod.name
			} else {
				moduleNames = moduleNames +mod.name
			}
			i++;
		})
		
		var orgDetail = {
							'_id' :  a1._id,
							"organizationName": a1.organizationName,
							"email": a1.email,
							"password": a1.password,
							"zipCode":a1.zipCode,
							"referCode":a1.referCode,
							"logo":a1.logo,
							"themecode":a1.themecode,
							"modules":moduleNames,
							"module_id":a1.module_id,
							"subModule_id":a1.subModule_id
						}
		
		const chatGroup = new ChatGroup({
			group_name: a1.organizationName,
			group_picture: a1.logo,
			challenge: "0",
			organization_id: a1.id,
			is_default: true
		})
		
		const chatGroupDetail =  await chatGroup.save() 
		var groupId = chatGroupDetail._id
		
		var firebaseData = {}
		firebaseData.id = ""
		firebaseData.profile_picture =  ""
		firebaseData.user_name =  ""
		firebaseData.dateTime = "",
		firebaseData.userId =  ""
		firebaseData.message =  ""
		firebaseData.isMyMessage = 0
		firebaseData.appTempId = ""
		var group = chatRef.child( groupId.toString());

		group.update(firebaseData,(err)=>{
			if(err){
				resMessage = "Something went wrong" + err;
				response = webResponse(200, true, resMessage)  
				res.send(response)		
				return;
			}
			else{
				response = webResponse(201, true, orgDetail)  
	            res.send(response)
				return;
			}
		})		
    }catch(err){ 
		response = webResponse(403, false, err)  
	    res.send(response)
    }
}) 
 
 router.get('/detail/:id', async(req,res) => {
    try{
           const organization = await Organization.findById(req.params.id)
           res.json(organization)
    }catch(err){
        res.send('Error ' + err)
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

	   const organization = await Organization.findOne({ email });

	   if(organization == null){
		response = webResponse(200, false, "Account not found.")  
	    res.send(response);
		return;
	   }

	   if(organization.status == '0'){
		response = webResponse(200, false, "Your account has been disabled by admin.")  
	    res.send(response);
		return;
	   }

		if (await bcrypt.compare(password, organization.password)) {
		  // Create token
		  const token = jwt.sign(
			{ user_id: organization._id, email, type: 'org'},
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
	   const organization = await Organization.findOne({ email });

		if (organization) {
			var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			var passwordLength = 10;
			var password = "";
			for (var i = 0; i <= passwordLength; i++) {
				var randomNumber = Math.floor(Math.random() * chars.length);
				password += chars.substring(randomNumber, randomNumber +1);
			}
			organization.password = bcrypt.hashSync(password, 12)
			result = await organization.save()
			let emailContent = "Your new password is "+password;
			let subject = 'Organization Forgot Password'
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


router.post('/forget/password', async(req,res) => {
    try{
        const organizationExist = await Organization.findOne({ email: req.body.email });
		
		let emailContent = "OTP is "+otp;
		let subject = 'Forgot password OTP '
		sendEmail(req.body.email, subject, emailContent)
			
		const result = {};
		result.otp = otp
		result.message = "OTP sent"
        response = webResponse(202, true, result)  
	    res.send(response)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.post('/delete', async(req,res) => {
    try{
        const id = req.body.id
		const status = req.body.status
		// Validate user input
		if(!(id)) {
			jsonObj = []

			if(!(id)){
				var item = {
					'key' : 'Organization id',
					'value' : 'required' 
				}
				jsonObj.push(item);
			}

	
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const organization = await Organization.findById(req.body.id)

		if(!organization) {
			response = webResponse(404, false, "Organization not found") 
			res.send(response)
			return "";
		}

		if(status == '0'){
			await Employee.updateMany({'userOrganizations': {$in: [req.body.id]}}, {$set: {userOrganizations: [], organizationId: false}}, {new: true});
		}
		
		await Organization.updateOne({'_id': req.body.id}, {$set: {status: status}}, {new: true});
		
		response = webResponse(202, true, {status: status}) 
		res.send(response)
		return "";

	}catch(err){
		console.log(err)
        res.send('Error ' + err)
    }
})



router.post('/reset/password', async(req,res) => {
    try{
        const organization = await Organization.findOne({ email: req.body.email });		
		organization.password = req.body.password
        const a1 = await organization.save()
        response = webResponse(200, true, "Password Updated")  
	    res.send(response)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.put('/profile/update/:id', async(req,res) => {
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



/*router.delete('/delete', async(req,res) => {
	Organization.findByIdAndDelete(req.body.id).then((organization) => {
        if (!organization) { console.log(organization)
            response = webResponse(200, true, "Org deleted")  
	        res.send(response)
        }
        //res.send(organization);
    }).catch((error) => {
        res.send('Error ' + error)
    }) 
})*/



router.put('/update/:id',async(req,res)=> {
	 try{ 
        const organization = await Organization.findById(req.params.id) 
		
		const emailExist = await Organization.find({_id: {$eq: req.params.id}, email:  req.body.email}) 

		if(emailExist.length !== 0 ){
			response = webResponse(200, false, "This email is already in use.") 
			res.send(response)
			return "";
		}

		var regex = new RegExp(["^", req.body.organizationName, "$"].join(""), "i");
		let nameExist = await Organization.find({organizationName: regex});

		if(nameExist.length !== 0 ) {
			resMessage = "An organization already exists with same name, Please choose another name";
			response = webResponse(200, false, resMessage)  
			res.send(response)		
			return;
	}

		organization.organizationName = req.body.organizationName
        organization.email = req.body.email,
        organization.password = req.body.password,
        organization.zipCode = req.body.zipCode,
		organization.themecolor= req.body.themecolor,
		organization.modules = req.body.modules,
		organization.module_id = req.body.module_id
		organization.subModule_id = req.body.subModule_id
		organization.logo = req.body.logo
        organization.themecode = req.body.themecode

        const a1 = await organization.save()
		
		var modules = a1.modules; 
		var ids = modules.split(",")
		var ModuleList = await Module.find({ _id : { $in : ids } })
		
		var moduleNames = ''
		var i = 0;
		ModuleList.forEach(function(mod){
			if(i > 0) {
				moduleNames = moduleNames+ ',' + mod.name
			} else {
				moduleNames = moduleNames +mod.name
			}
			i++;
		})
		
		var orgDetail = {
							'_id': a1._id,
							"organizationName": a1.organizationName,
							"email": a1.email,
							"password": a1.password,
							"zipCode": a1.zipCode,
							"referCode": a1.referCode,
							"logo": a1.logo,
							"themecode": a1.themecode,
							"modules": moduleNames,
							"module_id": a1.module_id,
							"subModule_id": a1.subModule_id,
							"status": a1.status,
						}
		
        response = webResponse(202, true, orgDetail)  
	    res.send(response)
    }catch(err){ console.log(err)
        res.send('err')
        //res.json(err)
    }

})

router.put('/update/theme', async(req,res)=> {
	 try{ 
        const organization = await Organization.findById(req.params.id) 	 
		organization.organizationName = req.body.organizationName
        organization.email = req.body.email,
        organization.password = req.body.password,
        organization.zipCode = req.body.zipCode,
		organization.themecolor= req.body.themecolor,
		organization.modules = req.body.modules
        const a1 = await organization.save()
        response = webResponse(202, true, a1)  
	    res.send(response)
    }catch(err){ console.log(err)
        res.send('err')
        //res.json(err)
    }
})


router.post("/orginzations/list", auth,  async(req, res) => {

		try{ 

			var empId = req.user.user_id;
			const employee = await Employee.findById(empId)
			if(!employee){
				response = webResponse(404, false, "Employee not found.")  
				res.send(response)
				return;
			}

			let myQuery = {};
			if(req.body.type === 'myOrgs')   myQuery = {$in: employee.userOrganizations}
			else  myQuery = {$nin: employee.userOrganizations}

			Organization.find({_id: myQuery}, function(err, data) {
				if(err) {
					response = webResponse(200, false, "Error fetching data")  
					res.json(response);
				    return "";
				} else {
					 
					let orgList = [];
					let count = 0;

					if(data.length!=0){

						data.forEach( (col) => {

							let orgDetail = {
								'_id' :  col._id,
								"organizationName": col.organizationName,
								"logo":col.logo,
							}
							orgList.push(orgDetail);
							count++;
							if(count === data.length){	
								response = webResponse(202, true, orgList)  
								res.send(response);
								return "";
							}

						})



					}else{
						response = webResponse(202, true, [])  
						res.json(response);
						return "";
					}
				}				
			});


		} catch(err){ 
			console.log(err)
			response = webResponse(403, false, err)  
			res.send(response)
			return;
		}

})

router.post("/addCode", auth,  async(req, res) => {

		try{ 

         let data = {
			 orgId: req.body.orgId,
             code: req.body.code
		 }

		 let newCode = new OrganizationCode(data);
		 let result = newCode.save();

		 response = webResponse(202, true, result)  
						res.json(response);
						return "";

		} catch(err){ 
			console.log(err)
			response = webResponse(403, false, err)  
			res.send(response)
			return;
		}

})


router.post("/confirmCode", auth,  async(req, res) => {

	try{ 

		var empId = req.user.user_id;
		const employee = await Employee.findById(empId);
		if(!employee){
			response = webResponse(404, false, "Employee not found.")  
			res.send(response)
			return;
		}

		let codeData = await Organization.findOne({referCode: req.body.code});
		if(codeData == null){

			response = webResponse(200, false, "Code not matched.")  
			res.json(response);
			return "";

		}

		let existingReqs = await organizationRequests.find({orgId: codeData._id, employeeId: empId, status: "0"});

		if(existingReqs.length != 0){
			response = webResponse(200, false, "A request is already pending.")  
			res.json(response);
			return "";
		}

		
		 let data = {
			orgId: codeData._id,
			employeeId: empId,
		 }

		  organizationRequests.deleteMany(data, () => {

			let newOrgReq = new organizationRequests(data);
			let result = newOrgReq.save();
   
			if(result){
			   response = webResponse(200, true, "Request has been sent to "+ codeData.organizationName)  
			   res.json(response);
			   return "";
			}else{
			   response = webResponse(200, false, "Internal server error.")  
			   res.json(response);
			   return "";
			}

		  });

 
	} catch(err){ 
		console.log(err)
		response = webResponse(403, false, err)  
		res.send(response)
		return;
	}

})


router.post("/swicthOrg", auth,  async(req, res) => {

	try{ 

		var empId = req.user.user_id;

		console.log('req.body.orgId', req.body.orgId);
		 
		await Employee.updateOne({_id: empId}, {$set: {organizationId: req.body.orgId}});

		const result = {};
		
		var appData = null;

		const organization = await Organization.findById(req.body.orgId)
		result.organization = organization
		var themecode = organization.themecode
		var logo = organization.logo
		if(organization != null && organization.themecode != null) {
			appData = await Theme.findById(organization.themecode)
		}						
		
		if(appData == null) {
			appData = await Theme.findOne()
		}
		if(logo == null)
		{
			var logo = process.env.ORGLOGO
		}
		
		result.appData = appData
		result.logo = logo

		setTimeout(async () => {
			const employee = await Employee.findOne({_id: empId});
			result.employee = employee
			response = webResponse(202, true, result);  
			res.json(response);
			return "";
		}, 200);

	} catch(err){ 
		console.log(err)
		response = webResponse(403, false, err)  
		res.send(response)
		return;
	}

})


// router.post("/swicthOrg", auth,  async(req, res) => {

// 	try{ 

// 		if(req.body.status === 1) {
// 			Employee.updateOne({_id: req.body.empId}, {$set: {isVerified: true}}, {$push: {userOrganizations: req.body.orgId}});
// 		}
// 		organizationRequests.updateOne({_id: req.body.reqId}, {$set: {status: status}});
// 		response = webResponse(202, true, "Success");  
// 		res.json(response);
// 		return "";

// 	} catch(err){ 
// 		console.log(err)
// 		response = webResponse(403, false, err)  
// 		res.send(response)
// 		return;
// 	}

// })

 module.exports = router