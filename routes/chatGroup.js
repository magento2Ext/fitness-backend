 const express = require("express");
 const router = express.Router()
 const ChatGroup = require('../models/chat_group')
 const Employee = require('../models/employee')
 const auth = require("../middleware/auth");
 var ObjectID = require('mongodb').ObjectID;
 require('../functions')

 const admin=require('firebase-admin');
/*var serviceAccount = require('../admin.json');
 admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DB,
	authDomain: process.env.AUTH_DOMAIN,
 });*/
 
 var db=admin.database();
 var chatRef=db.ref("chat");
 
 router.post('/list', auth, async(req,res) => {
    try{
		var empId = req.user.user_id; 
		//const chatGroup = await ChatGroup.find({'users': {'$in': empId}})
		const chatGroup = await ChatGroup.find( { $or:[ {'users':{'$in': empId}}, {'chat_group_requested_users':{'$in': empId}} ]} )
		
		var chatGroupArray = [];
		
		chatGroup.forEach( function(col){
			chat = {
				'id' :  col._id,
				"group_name": col.group_name,
				"group_picture": col.group_picture,
				"challenge": col.challenge,
				"users_count": col.users.length,
				"users_request_count": col.chat_group_requested_users.length
				
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

router.post('/detail', auth, async(req,res) => {
    try{
        var empId = req.user.user_id; 
		const id = req.body.id
		
		if(!(id)) {
			jsonObj = []
			var item = {
				'key' : 'id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		const chatGroup = await ChatGroup.findById(req.body.id)
		if(chatGroup == null) {
			response = webResponse(200, false, "Group not found")  
		    res.send(response)	
		} else {
			var empIds = chatGroup.users
			 
			const employees = await Employee.find({ _id: {$in:  empIds }})
			chat = {
				'id' :  chatGroup._id,
				"group_name": chatGroup.group_name,
				"group_picture": chatGroup.group_picture,
				"challenge": chatGroup.challenge,
				"users_count": chatGroup.users.length,
				"users": employees,
				
			}
			response = webResponse(202, true, chat)  
			res.send(response)		
			return;
		}
		
		
    }catch(err){
        res.send('Error ' + err)
    }
})
 
 router.post('/save', auth, async(req,res) => {
	try{ 
	    var empId = req.user.user_id;
		const chatGroup = new ChatGroup({
			group_name: req.body.group_name,
			group_picture: req.body.group_picture,
			challenge: req.body.challenge,
			chat_group_requested_users: req.body.chat_group_requested_users,
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
			
			var requestedUsers = req.body.chat_group_requested_users
			var requestedUsersArray = requestedUsers.split(',');
			
			chatGroupDetail.group_name= req.body.group_name,
			chatGroupDetail.group_picture= req.body.group_picture,
			chatGroupDetail.challenge= req.body.challenge,
			chatGroupDetail.users = userArray
			chatGroupDetail.chat_group_requested_users = requestedUsersArray
			
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
		
		if(req.body.chat_group_requested_users) {
			var requestedUsers = req.body.chat_group_requested_users
			var requestedUsersArray = requestedUsers.split(',');
			chatGroup.chat_group_requested_users = requestedUsersArray
		}
		const chatGroupDetail =  await chatGroup.save() 
		var groupId = chatGroupDetail._id
		
		var firebaseData = {}
		firebaseData.id = ""
		firebaseData.profile_picture =  ""
		firebaseData.user_name =  ""
		firebaseData.dateTime = "",
		firebaseData.userId =  ""
		firebaseData.message =  ""
		firebaseData.isMyMessage = 0
		firebaseData.appTempId = ""
		
		
			var group = chatRef.child( groupId.toString());
			group.update(firebaseData,(err)=>{
			if(err){
				resMessage = "Something went wrong" + err;
				response = webResponse(200, true, resMessage)  
				res.send(response)		
				return;
			}
			else{
				resMessage = "Group created"
				response = webResponse(200, true, resMessage)  
				res.send(response)		
				return;
			}
		})
	}catch(err){  console.log(err)
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