const express = require("express");
const router = express.Router()
const Admin = require('../models/admin')
const Theme = require('../models/theme_setting')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Organization = require('../models/organization')
const Challenge = require('../models/challenge')
const auth = require("../middleware/auth");
var ObjectID = require('mongodb').ObjectID;
const Employee = require('../models/employee');
const sendFCM = require('./fcm');
const CronJob = require('cron').CronJob;

router.post('/create', async(req, res) => {
   try{ 

       let {userId, type, title, description, pic, participants, start, end, orgType} = req.body;
       let data = {
                userId: userId,
                type: type,
                title: title,
                description: description,
                pic: pic,
                participants: participants,
                start: start,
                end: end,
                orgType: orgType
       }

       let newChallenge = new Challenge(data);
       let result = await newChallenge.save();

       if(result){
        response = webResponse(202, true, result)  
        res.send(response)
       }else{
        response = webResponse(202, false, 'Error saving challenge')  
        res.send(response)
       }
 
   }catch(err){ console.log(err)
       res.send(err)
   }
});

router.post('/update', async(req, res) => {
    try{ 

        let {id, type, title, description, pic, participants, start, end} = req.body;
        let data = {
                 type: type,
                 title: title,
                 description: description,
                 pic: pic,
                 participants: participants,
                 start: start,
                 end: end
        }
 
        let result = await Challenge.updateOne({_id: id}, {$set: data}, {new: true});
 
        if(result){
         response = webResponse(202, true, result)  
         res.send(response)
        }else{
         response = webResponse(202, false, 'Error saving challenge')  
         res.send(response)
        }
  
    }catch(err){ console.log(err)
        res.send(err)
    }
 });

 router.post('/delete', async(req,res) => {
    try{ 

        let result = await Challenge.updateOne({_id: req.body.id}, {$set: {status: '0'}}, {new: true});
 
        if(result){
         response = webResponse(202, true, result)  
         res.send(response)
        }else{
         response = webResponse(202, false, 'Error saving challenge')  
         res.send(response)
        }
  
    }catch(err){ console.log(err)
        res.send(err)
    }
 });


 router.post('/join', auth, async(req,res) => {
    try{ 
        let {id} = req.body;
        let empId = req.user.user_id;

        const challengeDetails = await Challenge.findOne({_id: id, participants: {$in: [empId]}}); 

        if(challengeDetails!=null){
            response = webResponse(202, false, 'Already Joined')  
            res.send(response);
            return;
        }

        const recentDate = new Date();
        console.log('recentDate', recentDate);

        if(recentDate >= challengeDetails.start){
            response = webResponse(202, false, 'Challenge has been already started')  
            res.send(response);
            return;
        }
        
        const result = await Challenge.updateOne({_id: id}, {$push: {'participants': empId}}, {new: true}); 	 
       
        if(result){
            response = webResponse(202, true, result)  
            res.send(response)
           }else{
            response = webResponse(202, false, 'Error saving challenge')  
            res.send(response)
           }
    }catch(err){ console.log(err)
        res.send(err)
        //res.json(err)
    };
});



router.post('/listAll', async(req, res) => {
    try{ 
        
        const result = await Challenge.aggregate([
            {$match: {userId: req.body.id}},
            {$set: {userId: {$toObjectId: "$userId"} }},
            {
                $lookup: {
                    from: "employees",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                }
            }
        ]); 	

        if(result){
            response = webResponse(202, true, result)  
            res.send(response)
           }else{
            response = webResponse(202, false, 'Error saving challenge')  
            res.send(response)
           }
    }catch(err){ console.log(err)
        res.send(err)
        //res.json(err)
    };
});


router.post('/myChallenges', auth, async(req, res) => {
    try{ 
        
        var empId = req.user.user_id;
        const employeeDetails = await Employee.findById(empId);
        let query = {}
        if(employeeDetails.userOrganizations.length !=0 ){
			query = {orgType: 'org', userId: String(employeeDetails.organizationId)}
		}else{
			query = {orgType: 'admin'}
		}
        

        const newChallenges =  await Challenge.aggregate([
            {$match: query},
            {$match: {status: 'new'}},
            { "$unwind": {path: "$participants", preserveNullAndEmptyArrays:true} },
            {$set: {participants: {$toObjectId: "$participants"} }},
            { "$lookup": {
               "from": "employees",
               "localField": "participants",
               "foreignField": "_id",
               "as": "participantsObjects"
            }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "#description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "participantsObjects": { "$push": "$participantsObjects" }
            }}
        ])

        const onGoingChallenges =  await Challenge.aggregate([
            {$match: query},
            {$match: {status: 'ongoing'}},
            { "$unwind": {path: "$participants", preserveNullAndEmptyArrays:true} },
            {$set: {participants: {$toObjectId: "$participants"} }},
            { "$lookup": {
               "from": "employees",
               "localField": "participants",
               "foreignField": "_id",
               "as": "participantsObjects"
            }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "#description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "participantsObjects": { "$push": "$participantsObjects" }
            }}
        ])

       

        const completedChallanges =  await Challenge.aggregate([
            {$match: query},
            {$match: {status: 'completed'}},
            { "$unwind": {path: "$participants", preserveNullAndEmptyArrays:true} },
            {$set: {participants: {$toObjectId: "$participants"} }},
            { "$lookup": {
               "from": "employees",
               "localField": "participants",
               "foreignField": "_id",
               "as": "participantsObjects"
            }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "#description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "participantsObjects": { "$push": "$participantsObjects" }
            }}
        ]);

        setTimeout(() => {

            let allChallenges = {
                newChallenges: newChallenges,
                onGoingChallenges: onGoingChallenges,
                completedChallanges: completedChallanges
            }
    
                response = webResponse(202, true, allChallenges)  
                res.send(response)
            
        }, 200);


 
    }catch(err){ console.log(err)
        res.send(err)
        //res.json(err)
    };
});


// var job = new CronJob(
// 	"57 18 * * *",
// 	async () =>  {

//         let employees = await Employee.find();

//         employees.forEach( async (emp) => {

//             if(errors.indexOf(emp.deviceToken) === -1){
//                 let today = new Date();
//                 const weightToday = await Weight.findOne({ employeeId: emp._id,
//                     date: {
//                         $eq: dateLib.format(today,'YYYY-MM-DD')
//                     }
//                 });

//                 if(weightToday == null){
//                     sendFCM(emp.deviceToken, 'Weight Reminder', "It seems like you forgot to add today's weight");
//                 }
//             }

//         })
		
// 	},
// 	null,
// 	true
// );


module.exports = router