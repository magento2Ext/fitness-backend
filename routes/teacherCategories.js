const express = require("express");
const router = express.Router()
const TeacherCats = require('../models/teacher_categories')
var ObjectID = require('mongodb').ObjectID;
require('../functions')


router.post('/list', async(req,res) => {
    try{
		const cats = await TeacherCats.find()
        response = webResponse(201, true, cats)  
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

		let {name, image_link} = req.body;
		if(!(name)){
	        jsonObj = []
			if(!(name)) {
				var item = {
					'key' : 'name',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}

		    response = webResponse(406, false, jsonObj) 
		    res.send(response)
		    return;
		}		

		if(req.body.id) {
			const catDetail = await TeacherCats.findById(req.body.id) 	
			if(!catDetail){
				response = webResponse(404, false, "Category not found")  
				res.send(response)
				return "";
			}
			catDetail.name = req.body.name;
		
			if(image_link) 	catDetail.image_link = req.body.image_link;
			
			const catDetailSaved = await catDetail.save()
			response = webResponse(202, true, catDetailSaved)  
			res.send(response)
			return "";
		}else{

			const cats = new TeacherCats({
				name: req.body.name
			})
	
			if(image_link) cats.image_link = image_link;

			const catDetail =  await cats.save()  
			response = webResponse(202, true, catDetail)  
			res.send(response)		
			return;

		}
		

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
				'key' : 'Category id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const catDetail = await TeacherCats.findById(req.body.id)
		if(!catDetail) {
			response = webResponse(404, false, "Category not found") 
			res.send(response)
			return "";
		}
		  const _id = new ObjectID(req.body.id);
		await TeacherCats.deleteOne( {'_id':_id})
		  
		var response = webResponse(200, true, "Category deleted") 
		res.send(response)
		return "";
	}catch(err){ console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})

module.exports = router