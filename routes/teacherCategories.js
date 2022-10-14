const express = require("express");
const router = express.Router()
const TeacherCats = require('../models/teacher_categories')
var ObjectID = require('mongodb').ObjectID;
const auth = require("../middleware/auth");
const Audio = require('../models/teacher_audio')
const Employee = require('../models/employee')
const Admin = require('../models/admin')
require('../functions')


router.post('/list', async(req,res) => {
    try{
		const cats = await TeacherCats.find({userId: req.body.userId, status: true})
        response = webResponse(201, true, cats)  
		res.send(response)		
		return;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

router.post('/deletecat', async(req,res) => {
    try{
		const result = await TeacherCats.updateOne({_id: req.body.id}, {$set: {status: false}}, {new: true});
        response = webResponse(201, true, result)  
		res.send(response)		
		return;
    }catch(err){
		console.log();
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})
 
router.post('/save', async(req,res) => {
	 try{ 

		let {name, image_link, userId, mediaType} = req.body;
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

			if(!(mediaType)) {
				var item = {
					'key' : 'mediaType',
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
			catDetail.mediaType = mediaType;
		
			if(image_link) 	catDetail.image_link = image_link;

			const catDetailSaved = await catDetail.save()
			response = webResponse(202, true, catDetailSaved)  
			res.send(response)
			return "";
		}else{

			const cats = new TeacherCats({
				name: name,
				userId: userId,
				mediaType: mediaType
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


router.post('/catsByType', auth, async (req,res) => {
    try{
		let {postType} = req.body;
		var empId = req.user.user_id;
		const employee = await Employee.findById(empId);
		const admin = await Admin.findOne();

		let query  = {};

		if(employee.userOrganizations.length != 0) query = {userId: employee.organizationId, postType: postType}
		else query = {userType: 'admin', postType: postType, userId: admin._id}

		if(!(postType)){
		  jsonObj = []
		  if(!(postType)) {
			  var item = {
				  'key' : 'postType',
				  'value' : 'required' 
			  }
			 jsonObj.push(item);
			 response = webResponse(406, false, jsonObj) 
			 res.send(response)
			 return "";
		  }
		}

		

		const posts = await Audio.find(query);


		console.log('posts', posts)

		if(posts.length != 0){
			let count = 0;
			let allCats = [];
			let addedCats = [];
			posts.forEach( async (key)=> {
				if(addedCats.indexOf(key.catId) === -1){
					addedCats.push(key.catId)
					let cat = await TeacherCats.findOne({_id: String(key.catId)});
					console.log(cat)
					if(cat!=null) allCats.push(cat);
				}

				count++;
				if(count == posts.length){
					response = webResponse(201, true, allCats)  
					res.send(response)		
					return;
				}

			})

		}else{

			response = webResponse(201, true, [])  
			res.send(response)		
			return;

		}

    }catch(err){
		console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})



router.post('/postByCat', auth, async (req,res) => {
    try{
		let {catId, postType} = req.body;
		var empId = req.user.user_id;
		const employee = await Employee.findById(empId);

		let query  = {};

		if(employee.userOrganizations.length != 0) query = {userId: employee.organizationId, catId: catId, postType: postType}
		else query = {userType: 'admin', postType: postType, catId: catId}

		if(!(postType)){
		  jsonObj = []
		  if(!(postType)) {
			  var item = {
				  'key' : 'postType',
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

		response = webResponse(406, false, jsonObj) 
		res.send(response)
		return "";

		}

		const posts = await Audio.find(query);

		if(posts.length != 0){
			
			response = webResponse(201, true, posts)  
			res.send(response)		
			return;

		}else{

			response = webResponse(201, true, [])  
			res.send(response)		
			return;

		}

    }catch(err){
		console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})

module.exports = router