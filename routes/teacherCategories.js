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

		let {name, image_link, userId} = req.body;
		if(!(name)){
	        jsonObj = []
			if(!(name)) {
				var item = {
					'key' : 'name',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}

			if(!(userId)) {
				var item = {
					'key' : 'userId',
					'value' : 'required' 
				}
			   jsonObj.push(item);
			}

			if(!(image_link)) {
				var item = {
					'key' : 'image_link',
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
			catDetail.name = name;
		
			if(image_link) 	catDetail.image_link = image_link;

			const catDetailSaved = await catDetail.save()
			response = webResponse(202, true, catDetailSaved)  
			res.send(response)
			return "";
		}else{

			const cats = new TeacherCats({
				name: name,
				userId: userId
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


router.post('/catsByType', auth, async(req,res) => {
    try{

		var empId = req.user.user_id;
		const employee = await Employee.findById(empId);

		let query  = {};

		if(employee.userOrganizations.length != 0) query = {userId: employee.organizationId, postType: postType}
		else query = {userType: 'admin', postType: postType}

		let {postType} = req.body;

		if(!(postType)){
		  jsonObj = []
		  if(!(postType)) {
			  var item = {
				  'key' : 'postType',
				  'value' : 'required' 
			  }
			 jsonObj.push(item);
		  }
		}

		const posts = await Audio.find(query);

		if(posts.length != 0){
			let count = 0;
			let allCats = [];
			posts.forEach( async (key)=> {

				let cat = await TeacherCats.findOne({_id: key.catId});
				allCats.push(cat);
				count++;
				if(count == posts.length){
					response = webResponse(201, true, allCats)  
					res.send(response)		
					return;
				}

			})

		}else{

			response = webResponse(201, false, "No cat")  
			res.send(response)		
			return;

		}

    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

module.exports = router