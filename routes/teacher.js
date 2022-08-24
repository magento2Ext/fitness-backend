const express = require("express");
const router = express.Router()
const Teachers = require('../models/teacher')
const Audio = require('../models/teacher_audio')
const Employee = require('../models/employee')
const auth = require("../middleware/auth");
const errors = ['', null, undefined];
var ObjectID = require('mongodb').ObjectID;
require('../functions')


router.post('/list', async(req,res) => { 
    try{
		const teachers = await Teachers.find()
        response = webResponse(201, true, teachers)  
		res.send(response)		
		return;;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.post('/addTeacher', async(req,res) => { 
    try{
	 
		let {name, teacher_image, orgId, type} = req.body;
		if(!(name && orgId && type)){
	        jsonObj = []
			if(!(name)) {
				var item = {
					'key' : 'name',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}

			if(!(orgId)) {
				var item = {
					'key' : 'orgId',
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
		    return;
		}

		console.log('teachersteachers')

		let newTeacher  = new Teachers({
			name: name,
			orgId: orgId,
			type: type,
		});

		if(teacher_image) newTeacher.teacher_image = teacher_image;
		const teachers =  await newTeacher.save();
		
		if(teachers)  response = webResponse(201, true, teachers);
		else  response = webResponse(201, false, "Something went wrong, please try again");
       
		res.send(response);
		return;

    }catch(err){
		console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})



router.post('/teachersByOrgId', auth, async(req,res) => { 
    try{
		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId)

		let query  = {};

		if(employeeDetails.userOrganizations.length != 0) query = {orgId: employeeDetails.organizationId, type: 'org'}
		else query = {type: 'admin'}

		const teachers = await Teachers.find(query);
        response = webResponse(201, true, teachers)  
		res.send(response)		
		return;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.post('/teachersCats', auth, async(req,res) => { 
    try{
		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId);
		let query  = {};
		if(employeeDetails.userOrganizations.length != 0) query = {orgId: employeeDetails.organizationId, type: 'org'}
		else query = {type: 'admin'}
		const teachers = await Audio.find(query);
        response = webResponse(201, true, teachers)  
		res.send(response)		
		return;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})
 
router.post('/save', async(req,res) => {
	
	try{ 
		const teacher = new Teachers({
			name: req.body.name,
			teacher_image: req.body.teacher_image
		})
		
		if(req.body.id) {
			const TeacherDetail = await Teachers.findById(req.body.id) 	
			if(!TeacherDetail){
				teacher_res = webResponse(404, false, "Category not found")  
				res.send(teacher_res)
				return "";
			}
			TeacherDetail.name= req.body.name,
			TeacherDetail.teacher_image= req.body.teacher_image
			const TeacherDetailSaved = await TeacherDetail.save()
			teacher_res = webResponse(202, true, TeacherDetailSaved) 
			if(teacher_res.result_obj._id)
			{
				try
				{
					const AudioDetail =	await Audio.find({teacher_id:teacher_res.result_obj._id}) 
					if(!AudioDetail){
						audio_res = webResponse(404, false, "Audio not found")  
						res.send(audio_res)
						return "";
					}
					for(i=0;i<req.body.audio_data.length;i++)
					{
						console.log(AudioDetail[i].id)
						const SingleAudio = await Audio.findById(AudioDetail[i].id)
						
						try
						{
							SingleAudio.audio_title= req.body.audio_data[i].audio_title,
							SingleAudio.audio_image= req.body.audio_data[i].audio_image,
							SingleAudio.audio_voice= req.body.audio_data[i].audio_voice,
							SingleAudio.audio_duration= req.body.audio_data[i].audio_duration,
							SingleAudio.parent_cat= req.body.audio_data[i].parent_cat,
							SingleAudio.child_cat= req.body.audio_data[i].child_cat
							
							const AudioDetailSaved = await SingleAudio.save()
							audio_res = webResponse(202, true, AudioDetailSaved)  
								
						
						
						}catch(err){ 
							audio_res = webResponse(403, false, err)  
							res.send(audio_res)
							return;
						} 
						
					}
					res.send(audio_res)
					return ""; 
				}catch(err){ 
						audio_res = webResponse(403, false, err)  
						res.send(audio_res)
						return;
					} 
			}
			res.send(teacher_res)
			return "";
		}
		
		const TeacherDetail =  await teacher.save()  
		teacher_res = webResponse(202, true, TeacherDetail) 
		if(teacher_res.result_obj._id)
		{
			for(i=0;i<=req.body.audio_data.length;i++)
			{
				try
				{
				const audio = new Audio({
					teacher_id: teacher_res.result_obj._id,
					audio_title: req.body.audio_data[i].audio_title,
					audio_image: req.body.audio_data[i].audio_image,
					audio_voice: req.body.audio_data[i].audio_voice,
					audio_duration: req.body.audio_data[i].audio_duration,
					parent_cat: req.body.audio_data[i].parent_cat,
					child_cat: req.body.audio_data[i].child_cat
				})
				const AudioDetail =  await audio.save()
				audio_res = webResponse(202, true, AudioDetail)
				res.send(audio_res)		
				
				
				}catch(err){ 
					audio_res = webResponse(403, false, err)  
					res.send(audio_res)
					return;
				} 
				
			}
		}
		
		return;
		
	}catch(err){ 
		teacher_res = webResponse(403, false, err)  
	    res.send(teacher_res)
		return;
    } 
})



router.post('/saveTeacherPost', async(req,res) => {
	
	try{ 

      let { userId, userType, catId, title, image, url, duration, mediaType, postType, id, teacher } = req.body;

	  if(!(userId && catId && title && image && url && duration && mediaType && postType )){
		jsonObj = []
		if(!(userId)) {
			var item = {
				'key' : 'userId',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(userType)) {
			var item = {
				'key' : 'userType',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(catId)) {
			var item = {
				'key' : 'catId',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(title)) {
			var item = {
				'key' : 'title',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(image)) {
			var item = {
				'key' : 'image',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(url)) {
			var item = {
				'key' : 'url',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(duration)) {
			var item = {
				'key' : 'duration',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(mediaType)) {
			var item = {
				'key' : 'mediaType',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		if(!(postType)) {
			var item = {
				'key' : 'postType',
				'value' : 'required' 
			}
		   jsonObj.push(item);
		}

		response = webResponse(406, false, jsonObj) 
		res.send(response)
		return;
	}

	let data = {
		userId: userId,
		catId: catId,
		title: title,
		image: image,
		url: url,
		duration: duration,
		mediaType: mediaType,
		postType: postType,
		userType: userType,
		teacher: teacher
     }

	 if(id){
		let result = await Audio.updateOne({_id: id}, {$set: data}, {new: true});
		response = webResponse(202, true, result)  
		res.send(response)
		return "";
	 }else{
		let newAudio = new Audio(data);
		let result = await newAudio.save();
		response = webResponse(202, true, result)  
		res.send(response)
		return "";

	 }

	}catch(err){ 
		console.log(err);
		teacher_res = webResponse(403, false, err)  
	    res.send(teacher_res)
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
				'key' : 'Teacher id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const TeacherDetail = await Teachers.findById(req.body.id)
		if(!TeacherDetail) {
			response = webResponse(404, false, "Teacher not found") 
			res.send(response)
			return "";
		}
		  const _id = new ObjectID(req.body.id);
		await Teachers.deleteOne( {'_id':_id})
		  
		var response = webResponse(200, true, "Teacher deleted") 
		res.send(response)
		return "";
	}catch(err){ console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})

module.exports = router