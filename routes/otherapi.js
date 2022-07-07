 const express = require("express");
 const router = express.Router()
 const Theme = require('../models/theme_setting')
 const Module = require('../models/module')

 require('../functions')
 


router.post('/all/themes', async(req,res) => {
    try{
		const themes = await Theme.find()
        response = webResponse(201, true, themes)  
		res.send(response)
		return "";
    }catch(err){
        res.send('Error ' + err)
		return "";
    }
})


router.post('/module/save', async(req,res) => {
    try{
		const moduleData = new Module({
			name: req.body.name,
			image: req.body.image
		})
		await moduleData.save()  
		response = webResponse(200, true, "Module Saved")  
		res.send(response)		
		return;
		
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.post('/module/list', async(req,res) => {
    try{
		const modules = await Module.find()
        response = webResponse(201, true, modules)  
		res.send(response)		
		return;;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

 module.exports = router