 const express = require("express");
 const router = express.Router()
 const MotivationalVideo = require('../models/motivational_video')
 const Employee = require('../models/employee')
 const auth = require("../middleware/auth");
var ObjectID = require('mongodb').ObjectID;
require('../functions')
 
 router.post('/list', async(req,res) => {
    try{
		const videos = await MotivationalVideo.find({auth_user_id:req.body.auth_user_id})
        response = webResponse(201, true, videos)  
		res.send(response)		
		return;;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.post('/Videoslist', auth, async(req,res) => {
    try{

		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId);
        let query = {};
		if(employeeDetails.userOrganizations.length !=0 ){
			query = {userType: 'org', auth_user_id: employeeDetails.organizationId}
		}else{
			query = {userType: 'admin'}
		}

		const videos = await MotivationalVideo.find(query)
        response = webResponse(201, true, videos)  
		res.send(response)		
		return;;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})
 
 router.post('/save', async(req,res) => {
	try{ 
		const video = new MotivationalVideo({
			auth_user_id: req.body.auth_user_id,
			name: req.body.name,
			title: req.body.title,
			description: req.body.description,
			placeholder_image: req.body.placeholder_image,
			video_link: req.body.video_link,
			video_duration: req.body.video_duration,
			userType: req.body.userType,
		})
		
		if(req.body.id) {
			const videoDetail = await MotivationalVideo.findById(req.body.id) 	
			if(!videoDetail){
				response = webResponse(404, false, "Motivational video not found")  
				res.send(response)
				return "";
			}
			videoDetail.auth_user_id= req.body.auth_user_id,
			videoDetail.name= req.body.name,
			videoDetail.title= req.body.title,
			videoDetail.description= req.body.description,
			videoDetail.placeholder_image= req.body.placeholder_image,
			videoDetail.video_link = req.body.video_link,
			videoDetail.video_duration = req.body.video_duration
			videoDetail.userType = req.body.userType
			const videoDetailSaved = await videoDetail.save()
			response = webResponse(202, true, videoDetailSaved)  
			res.send(response)
			return "";
		}
		
		const videoDetail =  await video.save()  
		response = webResponse(202, true, videoDetail)  
		res.send(response)		
		return;
	}catch(err){ 
		console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

router.post('/delete', async(req,res) => {
    try{
        const id = req.body.id
		// Validate user input
		if(!(id)) {
			jsonObj = []
			var item = {
				'key' : 'Motivational Video id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const videoDetail = await MotivationalVideo.findById(req.body.id)
		if(!videoDetail) {
			response = webResponse(404, false, "Motivational video not found") 
			res.send(response)
			return "";
		}
		  const _id = new ObjectID(req.body.id);
		await MotivationalVideo.deleteOne( {'_id':_id})
		  
		var response = webResponse(200, true, "Motivational video deleted") 
		res.send(response)
		return "";
	}catch(err){ console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})

 module.exports = router