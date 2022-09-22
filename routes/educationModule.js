 const express = require("express");
 const router = express.Router()
 const EducationModule = require('../models/education')
 const ModuleAdded = require('../models/module')
const dateLib = require('date-and-time')
const Employee = require('../models/employee')
const auth = require("../middleware/auth");
var ObjectID = require('mongodb').ObjectID;
require('../functions')
 
 
 
 router.post('/list', async(req,res) => {
    try{

		if(req.body.module_id) {
			var education = await EducationModule.find({ module_id: req.body.module_id,auth_user_id:req.body.auth_user_id });
		} else {
			var education = await EducationModule.find({auth_user_id:req.body.auth_user_id})
		}

        if(education.length == 0){
			console.log('education', [])
			return
		}

		var educationArray = [];
		let count = 0;

		education.forEach( async function(col){
			const module = await  ModuleAdded.findById(col.module_id)	 
			let moduleName = '';
			if(module.name) {
				moduleName = module.name;
			}
			
			let newEdu = {
				'_id' :  col._id,
				"title": col.title,
				"description": col.description,
				"placeholder_image": col.placeholder_image,
				"video_link": col.video_link,
				"module_name": moduleName,
				"module_id": col.module_id,
				"is_picture": col.is_picture,
				"created_at": col.created_at,
				"timeSinc":timeAgo(col.created_at) + "ago"
			}
			educationArray.push(newEdu)
			count++;

			if(count === education.length){
				response = webResponse(201, true, educationArray)  
				res.send(response)
				return "";
			}

		})

    }catch(err){  console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})

router.post('/educationList', auth, async(req,res) => {
    try{

		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId);
        let query = {};
		if(employeeDetails.userOrganizations.length !=0 ){
			query = {userType: 'org', auth_user_id: String(employeeDetails.organizationId), module_id: req.body.module_id}
		}else{
			query = {userType: 'admin', module_id: req.body.module_id}
		}

	
		var education = await EducationModule.find(query);
		 
		var educationArray = [];

		if(education.length!= 0){
			let count = 0;
			education.forEach( async (col) => {
				let moduleName = await  ModuleAdded.findById(col.module_id);
				console.log('moduleName', moduleName)
				newEdu = {
					'id' :  col._id,
					"title": col.title,
					"description": col.description,
					"placeholder_image": col.placeholder_image,
					"video_link": col.video_link,
					"module_name": moduleName != null ? moduleName.name : 'Mind',
					"module_id": col.module_id,
					"is_picture": col.is_picture,
					"created_at": col.created_at,
					"timeSinc":timeAgo(col.created_at) + "ago"
				}
	
				educationArray.push(newEdu); 
				count++;
				if(count == education.length){
					response = webResponse(202, true, educationArray)  
					res.send(response)
					console.log('response', response);
					return "";
				}
			})
		}else{
			response = webResponse(201, true, educationArray)  
			res.send(response)
			return "";
		}

    }catch(err){  console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})
 
 router.post('/save', async(req,res) => {
	try{ 
		const education = new EducationModule({
			auth_user_id: req.body.auth_user_id,
			title: req.body.title,
			description: req.body.description,
			placeholder_image: req.body.placeholder_image,
			video_link: req.body.video_link,
			module_id: req.body.module_id,
			is_picture: req.body.is_picture,
			userType: req.body.userType
		})
		
		if(req.body.id) {
			const educationDetail = await EducationModule.findById(req.body.id) 	
			if(!educationDetail){
				response = webResponse(404, false, "Education Module not found")  
				res.send(response)
				return "";
			}

			educationDetail.auth_user_id= req.body.auth_user_id,
			educationDetail.title= req.body.title,
			educationDetail.description= req.body.description,
			educationDetail.placeholder_image= req.body.placeholder_image,
			educationDetail.video_link= req.body.video_link,
			educationDetail.module_id= req.body.module_id,
			educationDetail.is_picture= req.body.is_picture
			educationDetail.userType= req.body.userType
			const educationDetailSaved = await educationDetail.save();
			let moduleName = await  ModuleAdded.findById(educationDetailSaved.module_id);
			let dict = {
				'_id' :  educationDetailSaved._id,
				"title": educationDetailSaved.title,
				"description": educationDetailSaved.description,
				"placeholder_image": educationDetailSaved.placeholder_image,
				"video_link": educationDetailSaved.video_link,
				"module_name": moduleName.name,
				"module_id": educationDetailSaved.module_id,
				"is_picture": educationDetailSaved.is_picture,
				"created_at": educationDetailSaved.created_at,
				"timeSinc":timeAgo(educationDetailSaved.created_at) + "ago"
			}
			response = webResponse(202, true, dict)  
			res.send(response)
			return "";
		}
		education.created_at = new Date()
		
		const educationDetailSaved =  await education.save()  

		let moduleName = await  ModuleAdded.findById(educationDetailSaved.module_id);
		let dict = {
			'_id' :  educationDetailSaved._id,
			"title": educationDetailSaved.title,
			"description": educationDetailSaved.description,
			"placeholder_image": educationDetailSaved.placeholder_image,
			"video_link": educationDetailSaved.video_link,
			"module_name": moduleName.name,
			"module_id": educationDetailSaved.module_id,
			"is_picture": educationDetailSaved.is_picture,
			"created_at": educationDetailSaved.created_at,
			"timeSinc":timeAgo(educationDetailSaved.created_at) + "ago"
		}

		response = webResponse(202, true, dict)  
		res.send(response)		
		return;
		
    }catch(err){ 
		console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

router.delete('/delete', async(req,res) => {
    try{
        const id = req.body.id
		// Validate user input
		if(!(id)) {
			jsonObj = []
			var item = {
				'key' : 'Education module id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const educationDetail = await EducationModule.findById(req.body.id)
		if(!educationDetail) {
			response = webResponse(404, false, "Education Module not found") 
			res.send(response)
			return "";
		}
		  
		const _id = new ObjectID(req.body.id);
		await EducationModule.deleteOne( {'_id':_id})
		
		
		response = webResponse(200, true, "Education Module deleted") 
		res.send(response)
		return "";
	}catch(err){
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})

 module.exports = router