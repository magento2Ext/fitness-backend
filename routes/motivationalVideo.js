 const express = require("express");
 const router = express.Router()
 const MotivationalVideo = require('../models/motivational_video')

require('../functions')
 
 router.post('/list', async(req,res) => {
    try{
		const videos = await MotivationalVideo.find()
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
			name: req.body.name,
			title: req.body.title,
			description: req.body.description,
			placeholder_image: req.body.placeholder_image,
			video_link: req.body.video_link,
			video_duration: req.body.video_duration
		})
		
		if(req.body.id) {
			const videoDetail = await MotivationalVideo.findById(req.body.id) 	
			if(!videoDetail){
				response = webResponse(404, false, "Motivational video not found")  
				res.send(response)
				return "";
			}
			videoDetail.name= req.body.name,
			videoDetail.title= req.body.title,
			videoDetail.description= req.body.description,
			videoDetail.placeholder_image= req.body.placeholder_image,
			videoDetail.video_link= req.body.video_link,
			videoDetail.video_duration= req.body.video_duration
			await videoDetail.save()
			response = webResponse(200, true, "Motivational video Updated")  
			res.send(response)
			return "";
		}
		
		const videoDetail =  await video.save()  
		response = webResponse(202, true, videoDetail)  
		res.send(response)		
		return;
	}catch(err){ 
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
		  
		videoDetail.deleteOne(req.body.id)
		response = webResponse(200, true, "Motivational video deleted") 
		res.send(response)
		return "";
	}catch(err){
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})

 module.exports = router