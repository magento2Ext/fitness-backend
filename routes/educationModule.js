 const express = require("express");
 const router = express.Router()
 const EducationModule = require('../models/education')

require('../functions')
 
 router.post('/list', async(req,res) => {
    try{
		if(req.body.module_id) {
			var education = await EducationModule.find({ module_id: req.body.module_id });
		} else {
			var education = await EducationModule.find()
		}
		
        response = webResponse(201, true, education)  
		res.send(response)
		return "";
    }catch(err){ console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})
 
 router.post('/save', async(req,res) => {
	try{ 
		const education = new EducationModule({
			title: req.body.title,
			description: req.body.description,
			placeholder_image: req.body.placeholder_image,
			video_link: req.body.video_link,
			module_id: req.body.module_id
		})
		
		if(req.body.id) {
			const educationDetail = await EducationModule.findById(req.body.id) 	
			educationDetail.title= req.body.title,
			educationDetail.description= req.body.description,
			educationDetail.placeholder_image= req.body.placeholder_image,
			educationDetail.video_link= req.body.video_link,
			educationDetail.module_id= req.body.module_id,
			await educationDetail.save()
			response = webResponse(200, true, "Education Module Updated")  
			res.send(response)
			return "";
		}
		
		
		const educationDetail =  await education.save()  
		response = webResponse(200, true, "Education Module Saved.")  
		res.send(response)		
		return;
		
    }catch(err){ 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

 module.exports = router