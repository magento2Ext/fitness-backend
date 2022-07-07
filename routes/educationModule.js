 const express = require("express");
 const router = express.Router()
 const EducationModule = require('../models/education')

require('../functions')
 
 router.get('/list', async(req,res) => {
    try{
		const aliens = await Employee.find()
        res.json(aliens)
		return '';
    }catch(err){
        res.send('Error ' + err)
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
		
		const educationDetail =  await education.save()  
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