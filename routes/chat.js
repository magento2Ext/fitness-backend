 const express = require("express");
 const router = express.Router()
 const auth = require("../middleware/auth");
 const Chat = require('../models/chat')
 const Employee = require('../models/employee')
  const dateLib = require('date-and-time')
 const admin=require('firebase-admin');
 
 
 var db=admin.database();
var chatRef=db.ref("chat");

router.post('/save', auth, async(req,res) => {
	try { 
		var empId = req.user.user_id;
		const message = new Chat({
			groupId: req.body.groupId,
			employeeId: empId,
			message: req.body.message,
			appTempId: req.body.appTempId,
			dateTime: new Date()
		})
	  
		var chatData = await message.save()  
		
		//firebase start
		const employeeDetails = await Employee.findById(empId)
		const username = employeeDetails.firstName + ' ' +employeeDetails.lastName;
	   	const data = req.body;
		var resMessage = "";
		var firebaseData = {}
		var chatId = chatData.id
		
		var asiaDate =  convertTZ(new Date(chatData.dateTime), 'Asia/Kolkata');
				
		firebaseData.id = chatId.toString()
		firebaseData.profile_picture =  employeeDetails.picture
		firebaseData.user_name =  employeeDetails.firstName + " " + employeeDetails.lastName
		firebaseData.dateTime = dateLib.format(new Date(asiaDate),'YYYY-MM-DD HH:mm:ss'), 
		firebaseData.userId =  empId
		firebaseData.message =  chatData.message
		firebaseData.appTempId =  chatData.appTempId
		firebaseData.isMyMessage = 1
		
        var oneUser=chatRef.child(req.body.groupId);
			oneUser.update(firebaseData,(err)=>{
			if(err){
				resMessage = "Something went wrong" + err;
				response = webResponse(200, true, resMessage)  
				res.send(response)		
				return;
			}
			else{
				resMessage = "Messsage sent"
				response = webResponse(200, true, resMessage)  
				res.send(response)		
				return;
			}
		})
		//firebase end
		
		
	} catch (err) { 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
	}
})

router.post('/list', auth, async(req,res) => {
	try { 
	
	   const groupId = req.body.groupId
		
		if(!(groupId)) {
			jsonObj = []
			var item = {
				'key' : 'groupId',
				'value' : 'required' 
			}
			jsonObj.push(item);
			response = webResponse(406, false, jsonObj) 
			res.send(response)
			return "";
		}
		var empId = req.user.user_id;
		const chat = await Chat.find({ groupId: groupId}).sort({dateTime:1}).populate('employeeId')
		var chatList = [];
		chat.forEach( function(col){
			var isMyMessage = 0;
			if(empId == col.employeeId._id) {
				isMyMessage = 1;
			}
			
			var asiaDate =  convertTZ(new Date(col.dateTime), 'Asia/Kolkata');
			chatDetail = {
				'id' :  col._id,
				//"dateTime1": dateLib.format(new Date(col.dateTime),'YYYY-MM-DD')+' '+date[4],
				"dateTime": dateLib.format(new Date(asiaDate),'YYYY-MM-DD HH:mm:ss'),
				"dateTimeSaved": col.dateTime,
				"profile_picture": col.employeeId.picture,
				"user_name": col.employeeId.firstName + " " +col.employeeId.lastName,
				"userId" : empId,
				"message": col.message,
				"appTempId": col.appTempId,
				"isMyMessage":isMyMessage,
				
			}
			chatList.push(chatDetail);
		})
		
		response = webResponse(201, false, chatList)  
	    res.send(response)
		return;
	} catch (err) { 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
	}
})



module.exports = router