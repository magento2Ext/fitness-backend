 const express = require("express");
 const router = express.Router()
 const MotivationalVideo = require('../models/motivational_video')

require('../functions')
 

 
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
		
		const videoDetail =  await video.save()  
		console.log(videoDetail)
			response = webResponse(202, true, videoDetail)  
			res.send(response)		
			return;
		
    }catch(err){ 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

 module.exports = router