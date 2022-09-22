const express = require("express");
const router = express.Router()
const Challenge = require('../models/challenge')
const Activity = require('../models/activities')
const Mind = require('../models/mind')
const auth = require("../middleware/auth");
const ObjectID = require('mongodb').ObjectID;
const Employee = require('../models/employee');
const sendFCM = require('./fcm');
const CronJob = require('cron').CronJob;
const errors = ['', '0', 0, null, undefined];


var job = new CronJob(
	"44 17 * * *",
	async () =>  {

        let challenges = await Challenge.find();

        challenges.forEach( async (challenge) => {

            const recentDate = new Date();

            if(recentDate == challenge.start){
               await Challenge.updateOne({_id: challenge._id}, {$set: {status: 'ongoing'}}, {new: true}); 
            }

            if(recentDate > challenge.end){
                await Challenge.updateOne({_id: challenge._id}, {$set: {status: 'completed'}}, {new: true}); 
             }
    
        })
		
	},
	null,
	true
);



router.post('/create', auth, async(req, res) => {
   try{ 

       let empId = req.user.user_id;
       const employee = await Employee.findById(empId);
       let {id, userId, type, title, description, pic, start, end, orgType, winners, invites, dailyStepLimit, weightType, targetWeight, targetBMI, activities} = req.body;

       if(orgType === 'employee' && !employee.organizationId){
        response = webResponse(202, false, 'Error saving challenge')  
        res.send(response)
        return;
       }

       let data = {
                userId: orgType === 'employee' ? employee.organizationId : userId,
                type: type,
                title: title,
                description: description,
                pic: pic,
                start: start,
                end: end,
                orgType: orgType,
                winners: winners,
                invites: invites,
                employeeId: orgType == 'employee' ? empId : null, 
        }
   
       if(type === 'steps'){
        data['dailyStepLimit'] = dailyStepLimit;
       }

       if(type === 'weight'){
          data['weightType'] = weightType;
          if(weightType === 'healthy')   data['targetBMI'] = targetBMI;
          else data['targetWeight'] = targetWeight;
       }

        if(errors.indexOf(id) === -1){
 
            let result = await Challenge.updateOne({_id: id}, {$set: data}, {new: true});

            if(type === 'mind'){
                 
                activities.forEach( (key) => {
                    let activityData =  {
                            challengeId: id,
                            title:  key.title,
                            description:  key.description,
                            attachement:  key.attachment
                       }
                    Activity.updateOne({_id: key.id}, {$set: activityData}, {new: true});
                    
                })
            }

            if(result){
                response = webResponse(202, true, result)  
                res.send(response)
               }else{
                response = webResponse(202, false, 'Error saving challenge')  
                res.send(response)
               }


        }else{
            let newChallenge = new Challenge(data);
            let result = await newChallenge.save();

            activities.forEach( (key) => {
                let activityData =  {
                        challengeId: result._id,
                        title:  key.title,
                        description:  key.description,
                        attachement:  key.attachment
                   }
                let newActivity =  new Activity(activityData);
                newActivity.save();
            })

            if(result){
                response = webResponse(202, true, result)  
                res.send(response)
               }else{
                response = webResponse(202, false, 'Error saving challenge')  
                res.send(response)
               }

        }


   }catch(err){ console.log(err)
       res.send(err)
   }
});



router.post('/admin/create', async(req, res) => {
    try{ 
 
        let {userId, type, title, description, pic, start, end, orgType, winners, invites} = req.body;
        let data = {
                 userId: userId,
                 type: type,
                 title: title,
                 description: description,
                 pic: pic,
                 start: start,
                 end: end,
                 orgType: orgType,
                 winners: winners,
                 invites: invites
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

        let {id, type, title, description, pic, participants, start, end, winners, invites} = req.body;
        let data = {
                 title: title,
                 description: description,
                 pic: pic,
                 participants: participants,
                 start: start,
                 end: end,
                 winners: winners,
                 invites: invites
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

        let result = await Challenge.deleteOne({_id: req.body.id});
 
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

        const challengeDetails = await Challenge.findOne({_id: id}); 

        if(challengeDetails.participants.indexOf(empId) >=0){
            response = webResponse(200, false, 'Already Joined')  
            res.send(response);
            return;
        }

        const recentDate = new Date();
        console.log('recentDate', recentDate);

        if(recentDate >= challengeDetails.start){
            response = webResponse(200, false, 'Challenge has been already started')  
            res.send(response);
            return;
        }

        const result = await Challenge.updateOne({_id: id}, {$push: {'participants': empId}, $pull: {'participants': empId}}, {new: true}); 	 
       
        if(result){
            response = webResponse(202, true, result)  
            res.send(response)
           }else{
            response = webResponse(200, false, 'Error saving challenge')  
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
			query = {orgType: {$ne: 'admin'}, $or: [{userId: String(employeeDetails.organizationId)}, {userId: String(empId)}]}
		}else{
			query = {orgType: {$ne: 'org'}}
		}

        const newChallenges =  await Challenge.aggregate([
            {$match: query},
            {$match: {status: 'new'}},
            {"$unwind": {path: "$participants", preserveNullAndEmptyArrays:true}},
            {$set: {participants: {$toObjectId: "$participants"} }},
            { "$lookup": {
               "from": "employees",
               "localField": "participants",
               "foreignField": "_id",
               "as": "participantsObjects"
            }},
            { "$lookup": {
                "from": "employees",
                "localField": "invites",
                "foreignField": "_id",
                "as": "invitesObjects"
             }},
             { "$lookup": {

                "from": "activities",
                "let": { "challengeId": "$_id" },
                "pipeline": [
                  { "$addFields": { "challengeId": { "$toObjectId": "$challengeId" }}},
                  { "$match": { "$expr": { "$eq": [ "$challengeId", "$$challengeId" ] } } }
                ],
                "as": "activitiesObj"

             }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activitiesObj"},
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
            { "$lookup": {
                "from": "employees",
                "localField": "invites",
                "foreignField": "_id",
                "as": "invitesObjects"
             }},
             { "$lookup": {

                "from": "activities",
                "let": { "challengeId": "$_id" },
                "pipeline": [
                  { "$addFields": { "challengeId": { "$toObjectId": "$challengeId" }}},
                  { "$match": { "$expr": { "$eq": [ "$challengeId", "$$challengeId" ] } } }
                ],
                "as": "activitiesObj"

             }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activities"},
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
            { "$lookup": {
                "from": "employees",
                "localField": "invites",
                "foreignField": "_id",
                "as": "invitesObjects"
             }},
             { "$lookup": {

                "from": "activities",
                "let": { "challengeId": "$_id" },
                "pipeline": [
                  { "$addFields": { "challengeId": { "$toObjectId": "$challengeId" }}},
                  { "$match": { "$expr": { "$eq": [ "$challengeId", "$$challengeId" ] } } }
                ],
                "as": "activitiesObj"

             }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activities"},
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
    };
});


router.post('/invitations', auth, async(req, res) => {
    try{ 
        
        var empId = req.user.user_id;
        const employeeDetails = await Employee.findById(empId);
        let query = {}
        if(employeeDetails.userOrganizations.length !=0 ){
			query = {orgType: {$ne: 'admin'}, $or: [{userId: String(employeeDetails.organizationId)}, {userId: String(empId)}], invites: {$in: [empId]}}
		}else{
			query = {orgType: {$ne: 'org'}, invites: {$in: [empId]}}
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
            { "$lookup": {
                "from": "employees",
                "localField": "invites",
                "foreignField": "_id",
                "as": "invitesObjects"
             }},
             { "$lookup": {

                "from": "activities",
                "let": { "challengeId": "$_id" },
                "pipeline": [
                  { "$addFields": { "challengeId": { "$toObjectId": "$challengeId" }}},
                  { "$match": { "$expr": { "$eq": [ "$challengeId", "$$challengeId" ] } } }
                ],
                "as": "activitiesObj"

             }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activities"},
                "participantsObjects": { "$push": "$participantsObjects" }
            }}
        ])

    
        setTimeout(() => {
                response = webResponse(202, true, newChallenges)  
                res.send(response)
        }, 200);

    }catch(err){ console.log(err)
        res.send(err)
    };
});


router.post('/challengeDetail', async(req, res) => {
    try{ 

        const challengeDetail =  await Challenge.aggregate([
            {$match: {_id: new ObjectID(req.body.id)}},
            { "$unwind": {path: "$participants", preserveNullAndEmptyArrays:true} },
            { "$unwind": {path: "$invites", preserveNullAndEmptyArrays:true} },
            {$set: {participants: {$toObjectId: "$participants"} }},
            {$set: {invites: {$toObjectId: "$invites"} }},
            { "$lookup": {
               "from": "employees",
               "localField": "participants",
               "foreignField": "_id",
               "as": "participantsObjects"
            }},
            { "$lookup": {
                "from": "employees",
                "localField": "invites",
                "foreignField": "_id",
                "as": "invitesObjects"
             }},
             { "$lookup": {

                "from": "activities",
                "let": { "challengeId": "$_id" },
                "pipeline": [
                  { "$addFields": { "challengeId": { "$toObjectId": "$challengeId" }}},
                  { "$match": { "$expr": { "$eq": [ "$challengeId", "$$challengeId" ] } } }
                ],
                "as": "activitiesObj"

             }},
            { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
            { "$unwind": {path: "$invitesObjects", preserveNullAndEmptyArrays:true}},
            {"$set": {"duration": {"$divide": [{ "$subtract": ["$end", "$start"] }, 1000 * 60 * 60 * 24]}}},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "type": { $first: "$type"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activitiesObj"},
                "participantsObjects": { "$push": "$participantsObjects" },
                "invitesObjects": { "$push": "$invitesObjects" }
            }}
        ])

    
        setTimeout(() => {
                response = webResponse(202, true, challengeDetail)  
                res.send(response)
        }, 200);

    }catch(err){
         console.log(err)
        res.send(err)
    };
});


router.post('/mindLeaderboard', auth, async(req, res) => {
    try{ 

        let empId = req.user.user_id;
        const employee = await Employee.findById(empId);

        let {challegeId} = req.body;

        const challengeDetail =  await Challenge.aggregate([
            {$match: {_id: new ObjectID(challegeId)}},
            { "$unwind": {path: "$participants", preserveNullAndEmptyArrays:true} },
            { "$lookup": {
               "from": "minds",
               "localField": "participants",
               "foreignField": "employeeId",
               "as": "participantsObjects"
            }},
            {
                $match:{
                   "participantsObjects.challengeId": challegeId
                }
             },
             { "$unwind": {path: "$participantsObjects", preserveNullAndEmptyArrays:true}},
             {
                "$group": {
                "_id": "$_id",
                "participantsObjects": { "$push": "$participantsObjects" },
            }}
        ]);

        console.log('challengeDetail', challengeDetail);

        setTimeout(() => {
                response = webResponse(202, true, challengeDetail)  
                res.send(response)
        }, 200);

    }catch(err){
         console.log(err)
        res.send(err)
    };
});

router.post('/markActivity', auth, async(req, res) => {
    try{ 
 
        let empId = req.user.user_id;
        const employee = await Employee.findById(empId);
        let {activityId} = req.body;

        let activityDetails = await Activity.findOne({_id: activityId})
 
        if(activityDetails === null){
         response = webResponse(202, false, 'Activity not found')  
         res.send(response)
         return;
        }

        let newMind = new Mind({
            employeeId: empId,
            activityId: activityId,
            challengeId: activityDetails.challengeId
        })

        let result = await newMind.save();

        response = webResponse(202, true, result)  
        res.send(response)

    }catch(err){ console.log(err)
        res.send(err)
    }
 });

module.exports = router