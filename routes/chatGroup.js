 const express = require("express");
 const router = express.Router()
 const ChatGroup = require('../models/chat_group')
  const auth = require("../middleware/auth");
 var ObjectID = require('mongodb').ObjectID;
 require('../functions')
 
 router.post('/list', auth, async(req,res) => {
    try{
		var empId = req.user.user_id; 
		const chatGroup = await ChatGroup.find({'users': {'$in': empId}})
		
		var chatGroupArray = [];
		
		chatGroup.forEach( function(col){
			chat = {
				'id' :  col._id,
				"group_name": col.group_name,
				"group_picture": col.group_picture,
				"challenge": col.challenge,
				"users_count": col.users.length,
				
			}
			chatGroupArray.push(chat);
		})
		
		
        response = webResponse(201, true, chatGroupArray)  
		res.send(response)		
		return;
    }catch(err){
        response = webResponse(200, false, "Something went wrong, please try again")  
	    res.send(response)
		return;
    }
})
 
 router.post('/save', auth, async(req,res) => {
	try{ 
	    var empId = req.user.user_id;
		const chatGroup = new ChatGroup({
			group_name: req.body.group_name,
			group_picture: req.body.group_picture,
			challenge: req.body.challenge,
			users: req.body.users,
			group_admin: empId
		})
		if(req.body.id && req.body.id != "0") {
			const chatGroupDetail = await ChatGroup.findById(req.body.id) 	
			if(!chatGroupDetail){
				response = webResponse(404, false, "ChatGroup not found")  
				res.send(response)
				return "";
			}
			var users = req.body.users
			var userArray = users.split(',');
			userArray.push(empId);
			
			
			chatGroupDetail.group_name= req.body.group_name,
			chatGroupDetail.group_picture= req.body.group_picture,
			chatGroupDetail.challenge= req.body.challenge,
			chatGroupDetail.users = userArray
			
			const chatGroupDetailSaved = await chatGroupDetail.save()
			response = webResponse(200, true, "Group updated")  
			res.send(response)
			return "";
		}
		
		if(req.body.users) {
			var users = req.body.users
			var userArray = users.split(',');
			userArray.push(empId);
			chatGroup.users = userArray
		}
		const chatGroupDetail =  await chatGroup.save()  
		response = webResponse(200, true, "Group created")  
		res.send(response)		
		return;
	}catch(err){ 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

/*router.delete('/delete', async(req,res) => {
    try{
        const id = req.body.id
		// Validate user input
		if(!(id)) {
			jsonObj = []
			var item = {
				'key' : ' chatGroup id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		
		const chatGroupDetail = await ChatGroup.findById(req.body.id)
		if(!chatGroupDetail) {
			response = webResponse(404, false, "Motivational chatGroup not found") 
			res.send(response)
			return "";
		}
		  const _id = new ObjectID(req.body.id);
		await ChatGroup.deleteOne( {'_id':_id})
		  
		var response = webResponse(200, true, "Motivational chatGroup deleted") 
		res.send(response)
		return "";
	}catch(err){ console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
	    res.send(response)
		return;
    }
})
*/
 module.exports = router