 const express = require("express");
 const router = express.Router()
 const admin=require('firebase-admin');
 const auth = require("../middleware/auth");
 const Chat = require('../models/chat')
 const Employee = require('../models/employee')
 var serviceAccount = require('../admin.json');
 
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
			message: req.body.message
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
		var empId = req.user.user_id;
		var groupId = req.body.groupId;
	const chat = await Chat.find({ groupId: groupId}).populate('employeeId')
		res.send(chat)
		return;
	} catch (err) { console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
	}
})



module.exports = router