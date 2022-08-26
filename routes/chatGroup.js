 const express = require("express");
 const router = express.Router()
 const ChatGroup = require('../models/chat_group')
 const Employee = require('../models/employee')
 const auth = require("../middleware/auth");
 var ObjectID = require('mongodb').ObjectID;
 require('../functions')

 const admin=require('firebase-admin');
 
 var db=admin.database();
 var chatRef=db.ref("chat");
 
 router.post('/employee/list', auth, async(req,res) => {
    try{
		var empId = req.user.user_id;
		const groupId = req.body.groupId
		
		if(!(groupId)) {
			jsonObj = []
			var item = {
				'key' : 'Group Id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		const employeeDetails = await Employee.findById(empId)
		const groupDetails = await ChatGroup.findById(groupId)
		if(employeeDetails.employeeType && employeeDetails.employeeType == "Coorporate") {
			var employees = await Employee.find({employeeType:"Coorporate", organizationId:employeeDetails.organizationId})
		} else {
			var employees = await Employee.find({employeeType:"Individual"})
		}
		var employeeList = [];
		
		employees.forEach( function(col){
			var isInvited = false;
			var isAdded = false;
			var users = groupDetails.users
			var requestedUsers = groupDetails.chat_group_requested_users
			employee = {
				'id' :  col._id,
				"firstName": col.firstName,
				"lastName": col.lastName,
				"picture": col.picture,
				"email": col.email,
				"isInvited":requestedUsers.includes( col._id),
				"isAdded": users.includes( col._id)
			}
			employeeList.push(employee);
		})
		
		
        response = webResponse(201, true, employeeList)  
		res.send(response)
		return "";
    }catch(err){ 
        response = webResponse(200, false, "Something went wrong, please try again.")  
		res.send(response)
		return "";
    }
 })



 router.post('/list', auth, async(req,res) => {
    try{
		var empId = req.user.user_id; 
		const employeeDetails = await Employee.findById(empId)
		//const chatGroup = await ChatGroup.find({'users': {'$in': empId}})
		let query = { $or:[ {'users':{'$in': empId}}, {'chat_group_requested_users':{'$in': empId}} ]}

		if(employeeDetails.userOrganizations.length != 0 ){
			query['organization_id'] =  employeeDetails.organizationId
		}
		const chatGroup = await ChatGroup.find(query)
		
		console.log('chatGroup', chatGroup);
		var chatGroupArray = [];
		
		chatGroup.forEach( function(col){
			var requestedUserIds = col.chat_group_requested_users
			var empIds = col.users
			
			var isInvited = isAdded = false;
			var userRequested = requestedUserIds.indexOf(empId); 
			if (userRequested > -1) { 
				isInvited = true;
			}
			
			var userAdded = empIds.indexOf(empId); 
			if (userAdded > -1) { 
				isAdded = true;
			}
			
			
			chat = {
				'id': col._id,
				"group_name": col.group_name,
				"group_picture": col.group_picture,
				"challenge": col.challenge,
				"users_count": col.users.length,
				"users_request_count": col.chat_group_requested_users.length,
				"isInvited": isInvited,
				"isAdded": isAdded
				
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


router.post('/list', auth, async(req,res) => {
    try{

		var empId = req.user.user_id; 
	 
		const chatGroup = await ChatGroup.find( { $or:[ {'users':{'$in': empId}}, {'chat_group_requested_users':{'$in': empId}} ]} )
		
		var chatGroupArray = [];
		
		chatGroup.forEach( function(col){
			var requestedUserIds = col.chat_group_requested_users
			var empIds = col.users
			
			var isInvited = isAdded = false;
			var userRequested = requestedUserIds.indexOf(empId); 
			if (userRequested > -1) { 
				isInvited = true;
			}
			
			var userAdded = empIds.indexOf(empId); 
			if (userAdded > -1) { 
				isAdded = true;
			}
			
			
			chat = {
				'id': col._id,
				"group_name": col.group_name,
				"group_picture": col.group_picture,
				"challenge": col.challenge,
				"users_count": col.users.length,
				"users_request_count": col.chat_group_requested_users.length,
				"isInvited": isInvited,
				"isAdded": isAdded
				
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
			var requestedUserIds = chatGroup.chat_group_requested_users
            let objIds =  [];
			requestedUserIds.forEach( (key) => {
				if(key.match(/^[0-9a-fA-F]{24}$/)){
					objIds.push(key)
				}
			})
			

			console.log('objIds', objIds)
           
			const employees = await Employee.find({ _id: {$in:  empIds }})
			const requestedUsers = await Employee.find({ _id: {$in:  objIds }})
			
			var isInvited = isAdded = false;
			var userRequested = objIds.indexOf(empId); 
			if (userRequested > -1) { 
				isInvited = true;
			}
			
			var userAdded = empIds.indexOf(empId); 
			if (userAdded > -1) { 
				isAdded = true;
			}
			
			
			chat = {
				'id' :  chatGroup._id,
				"group_name": chatGroup.group_name,
				"group_picture": chatGroup.group_picture,
				"challenge": chatGroup.challenge,
				"group_admin": chatGroup.group_admin,
				"isInvited": isInvited,
				"isAdded": isAdded,
				"users_count": chatGroup.users.length,
				"users": employees,
				"requestedUsers": requestedUsers
				
			}
			
			response = webResponse(202, true, chat)  
			res.send(response)		
			return;
		}
		
		
    }catch(err){
		console.log(err);
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
			var userArray = []
			if(users != "") {
			   userArray = users.split(',');
			}
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
		} else {
			var userArray = []
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
	}catch(err){  
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})

 router.post('/accept/invite', auth, async(req,res) => {
	try{
		var empId = req.user.user_id;
		const groupId = req.body.groupId
		
		if(!(groupId)) {
			jsonObj = []
			var item = {
				'key' : 'Group Id',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		
		const employeeDetails = await Employee.findById(empId)
		const groupDetails = await ChatGroup.findById(groupId)
		if(groupDetails == null) {
			response = webResponse(200, false, "Group not found.") 
			res.send(response)
			return "";
		}
		
		var invitedUsers = groupDetails.chat_group_requested_users
		var users = groupDetails.users
		
		const index = invitedUsers.indexOf(empId); 
		if (index > -1) { 
			users.push(empId) 
		    invitedUsers.splice(index, 1)
			
		    groupDetails.chat_group_requested_users = invitedUsers;
			groupDetails.users = users
			
			const chatGroupDetailSaved  = await groupDetails.save();
			response = webResponse(200, true, "Invitation accepted")  
			res.send(response)
			return "";
		} else {
			response = webResponse(200, false, "You are not invited.") 
			res.send(response)
			return "";
		}
		
    }catch(err){ console.log(err)
        response = webResponse(200, false, "Something went wrong, please try again.")  
		res.send(response)
		return "";
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


router.post('/getGroupMembers', auth, async(req,res) => {

	try{

		var empId = req.user.user_id;
		// const employeeDetails = await Employee.findById(empId)

		let members = await ChatGroup.findOne({_id: req.body.id});
		if(members!=null){
			let allMembers = members.users;

			if(allMembers.length != 0){

				let users = [];
				let count = 0;
				allMembers.forEach( async (key) => {
     
					if(key != empId){
						let employeee = await Employee.findById(key);
						if(employeee != null) users.push(employeee);
					}

					count++;

					if(count === allMembers.length) {
						response = webResponse(200, true, users)  
						res.send(response)
						return "";
					}
					
				})


			}else{
				response = webResponse(200, false, "No Members")  
				res.send(response)
				return "";
			}

		}else{
			response = webResponse(200, false, "No data")  
			res.send(response)
			return "";
		}

	}
    catch(err){ console.log(err)
	response = webResponse(200, false, "Something went wrong, please try again.")  
	res.send(response)
	return;
    }

});

 module.exports = router