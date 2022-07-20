 const express = require("express");
 const router = express.Router()
 const admin=require('firebase-admin');
 const auth = require("../middleware/auth");
 const Chat = require('../models/chat')
 const Employee = require('../models/employee')
 var serviceAccount = require('../admin.json');
 const dateLib = require('date-and-time')
 
 admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DB,
	authDomain: process.env.AUTH_DOMAIN,
 });

var db=admin.database();
var chatRef=db.ref("chat");

router.post('/save', auth, async(req,res) => {
	try { 
		var empId = req.user.user_id;
		const message = new Chat({
			groupId: req.body.groupId,
			employeeId: empId,
			message: req.body.message,
			dateTime: new Date()
		})
	  
		await message.save()  
		
		//firebase start
		const employeeDetails = await Employee.findById(empId)
		const username = employeeDetails.firstName + ' ' +employeeDetails.lastName;
	   	const data = req.body;
		var resMessage = "";
		data.username = username
		
        var oneUser=chatRef.child(req.body.groupId);
			oneUser.update(data,(err)=>{
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
		const chat = await Chat.find({ groupId: groupId}).populate('employeeId')
		var chatList = [];
		chat.forEach( function(col){
			var isMyMessage = 0;
			if(empId == col.employeeId._id) {
				isMyMessage = 1;
			}
			chatDetail = {
				'id' :  col._id,
				"dateTime": dateLib.format(new Date(col.dateTime),'YYYY-MM-DD HH:MM:SS'),
				"profile_picture": col.employeeId.picture,
				"message": col.message,
				"isMyMessage":isMyMessage,
				
			}
			chatList.push(chatDetail);
		})
		
		response = webResponse(201, false, chatList)  
	    res.send(response)
		return;
	} catch (err) { console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
	}
})



module.exports = router