 const express = require("express");
 const router = express.Router()
 const Organization = require('../models/organization')
 const Employee = require('../models/employee')
 const Module = require('../models/module')
 const md5 = require('md5');
 const nodemailer = require('nodemailer');
 const size = process.env.RECORD_LIMIT
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 const auth = require("../middleware/auth");
require('../functions')
 
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
        Organization.find({},{},query,function(err,data) {
				if(err) {
					//response = {"error" : true,"message" : "Error fetching data"};
					response = webResponse(200, false, "Error fetching data")  
				} else {
					const result = {}
					console.log(size)
					result.totalRecords =  totalRecords;
					result.rowsPerPage = size;
					result.pages = Math.ceil(totalRecords/size);
					result.data = data;
					response = webResponse(202, true, result)  
				}
				res.json(response);
			});
           //res.json(aliens)
    }catch(err){
        res.send('Error ' + err)
    }
})

router.post("/module/list", auth, async(req, res) => { 
  try{ 
		var empId = req.user.user_id;
		const employee = await Employee.findById(empId)
		if(employee.employeeType == "Coorporate") {
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
	let referCode = (Math.random() + 1).toString(36).substring(6);
	const organization = new Organization({
        organizationName: req.body.organizationName,
       // logo: req.file.name,
       // hexCode: req.body.hexCode,
        email: req.body.email,
       // password: md5(req.body.password),
        zipCode: req.body.zipCode,
        referCode: referCode,
        modules: req.body.modules,
		logo: process.env.ORGLOGO,
		themecode: '62c3de94a4db9348c847b5e1'
    })

    try{
		if(req.body.password) {
			organization.password = await bcrypt.hashSync(req.body.password, 12)
		}
        const a1 =  await organization.save() 
		
		let emailContent = "Organization Code is "+referCode;
		let subject = 'Organization Code'
		sendEmail(req.body.email, subject, emailContent)
		
		response = webResponse(201, true, a1)  
	    res.send(response)
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

		if (organization && (await bcrypt.compare(password, organization.password))) {
		  // Create token
		  const token = jwt.sign(
			{ user_id: organization._id, email },
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
		} 
		response = webResponse(200, false, "Invalid credentials")  
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

router.delete('/delete', async(req,res) => {
    try{
        const id = req.body.id
		// Validate user input
		if(!(id)) {
			jsonObj = []
			var item = {
				'key' : 'Organization id',
				'value' : 'required' 
			}
			jsonObj.push(item);
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
		
		const employees = await Employee.deleteMany({'organizationId':req.body.id})
		
		organization.deleteOne(req.body.id)
		response = webResponse(200, true, "Organization deleted") 
		res.send(response)
		return "";
	}catch(err){
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

router.put('/update/theme',async(req,res)=> {
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

 module.exports = router