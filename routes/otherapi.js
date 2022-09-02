 const express = require("express");
 const router = express.Router()
 const Theme = require('../models/theme_setting')
 const Module = require('../models/module')
 const SubModule = require('../models/sub_module')
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

router.post('/submodule/save', async(req,res) => {
    try{
		const subModuleData = new SubModule({
			moduleId: req.body.moduleId,
			name: req.body.name,
			image: req.body.image
		})

		if(req.body.id) {
			const subModule = await SubModule.findById(req.body.id) 	
			if(!subModule){
				response = webResponse(404, false, "Sub Module not found")  
				res.send(response)
				return "";
			}
			subModule.moduleId= req.body.moduleId,
			subModule.name= req.body.name,
			subModule.image= req.body.image
			
			const subModuleSaved = await subModule.save()
			response = webResponse(202, true, subModuleSaved)  
			res.send(response)
			return "";
		}

		const subModule = await subModuleData.save()  
		response = webResponse(202, true, subModule)  
		res.send(response)		
		return;
		
    }catch(err){// console.log(err)
        response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

router.post('/submodule/list', async(req,res) => {
    try{
		if(req.body.moduleId) {
			var subModules = await SubModule.find({"moduleId":req.body.moduleId})
		} else {
			var subModules = await SubModule.find()
        }
		response = webResponse(201, true, subModules)  
		res.send(response)		
		return;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.post('/module/submodule', async(req,res) => {
    try{
		var modules = await Module.find()
		var subModules = await SubModule.find()
		var subModuleList = []
		for(var i=0; i< modules.length; i++) {
			console.log(modules[i].id)
			var subModules = await SubModule.find({"moduleId":modules[i].id})
			moduleData = {
				module_id : modules[i].id,
				module_name : modules[i].name,
				subcategories: subModules
			}
			subModuleList.push(moduleData);
		}
		
		response = webResponse(201, true, subModuleList)  
		res.send(response)		
		return;
    }catch(err){ 
	console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

 module.exports = router