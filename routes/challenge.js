const express = require("express");
const router = express.Router()
const Challenge = require('../models/challenge')
const Activity = require('../models/activities')
const challengeMind = require('../models/challengeMind')
const auth = require("../middleware/auth");
const ObjectID = require('mongodb').ObjectID;
const Employee = require('../models/employee');
const sendFCM = require('./fcm');
const CronJob = require('cron').CronJob;
const errors = ['', '0', 0, null, undefined];
const dateLib = require('date-and-time');
const Admin = require('../models/admin')
const challengeWeight = require('../models/challengeWeight')
const Weight = require('../models/weight')
const StepTracker = require('../models/step_tracker')
const challengeStepTracker = require('../models/challengeStepTracker')
const EmpStepTarget = require('../models/employee_step_target')
const arraySort = require('array-sort')

var job = new CronJob(
	"1/2 * * * * *",
	async () =>  {
        let challenges = await Challenge.find();
       
        challenges.forEach( async (challenge) => {
            const recentDate = new Date();

            const strDate = dateLib.format(recentDate,'YYYY-MM-DD')
    
            const recentDateYMD =  strDate+ 'T00:00:00.000Z'


            let date_recent = new Date(recentDateYMD);
            let date_start = new Date(challenge.start);
            let date_end = new Date(challenge.end);
 
            if(date_recent >= date_start){
               
               if(challenge.status === 'new') {
                   await Challenge.updateOne({_id: challenge._id}, {$set: {status: 'ongoing'}}, {new: true}); 
                }
            }

            if(date_recent > date_end){
                await Challenge.updateOne({_id: challenge._id}, {$set: {status: 'completed'}}, {new: true}); 
             }
    
        })
		
	},
	null,
	true
);


router.post('/create', auth, async(req, res) => {
   try{ 
    
       console.log(req.body)
       let mindTypes = ['yoga', 'meditation', 'mood', 'routine', 'fitness', 'mind'];
       let empId = req.user.user_id;
       const employee = await Employee.findById(empId);
       const admins = await Admin.find();
       
       let {id, userId, type, title, description, pic, start, end, orgType, winners, invites, dailyStepLimit, weightType, targetWeight, targetBMI, activities} = req.body;

       let data = {
                    userId: orgType === 'employee' ? (employee.userOrganizations.length > 0 ? employee.organizationId : admins[0]._id) : userId,
                    type: type,
                    title: title,
                    description: description,
                    pic: pic,
                    start: start,
                    end: end,
                    orgType: orgType,
                    winners: winners,
                    invites: invites,
                    employeeId: orgType == 'employee' ? empId : null
               }
   
       if(type === 'steps'){
        data['dailyStepLimit'] = dailyStepLimit;
       }

       if(type === 'weight'){
          data['weightType'] = weightType;
          if(weightType === 'healthy')  data['targetBMI'] = targetBMI;
          else data['targetWeight'] = targetWeight;
       }

        if(errors.indexOf(id) === -1){
 
            let result = await Challenge.updateOne({_id: id}, {$set: data}, {new: true});

            if(mindTypes.indexOf(type) >=0 ){
                let activityDate = start
                activities.forEach( (key) => {
                    
                    let activityData =  {
                            challengeId: id,
                            title:  key.title,
                            description:  key.description,
                            attachement:  key.attachment,
                            activityDate: activityDate
                       }

                    Activity.updateOne({_id: key.id}, {$set: activityData}, {new: true});
                    let newDate = new Date(activityDate)
                    newDate.setDate(newDate.getDate() + 1)
                    let YMD = dateLib.format(newDate, 'YYYY-MM-DD')
                    activityDate = YMD + "T00:00:00.000+00:00"
                    
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
            data["createdOn"] = new Date();
            if(orgType === 'employee') data["participants"] = [empId]
            
            let newChallenge = new Challenge(data);
            let result = await newChallenge.save();

            let activityDate = start
            if(mindTypes.indexOf(type) >=0){
                activities.forEach( (key) => {
                    let activityData =  {
                            challengeId: result._id,
                            title:  key.title,
                            description:  key.description,
                            attachement:  key.attachment,
                            activityDate: activityDate
                       }
                    let newActivity =  new Activity(activityData);
                    newActivity.save();
                    let newDate = new Date(activityDate)
                    newDate.setDate(newDate.getDate() + 1)
                    let YMD = dateLib.format(newDate, 'YYYY-MM-DD')
                    activityDate = YMD + "T00:00:00.000+00:00"
                })
            }

            if(result){
                response = webResponse(202, true, result)  
                res.send(response)
               }else{
                response = webResponse(202, false, 'Error saving challenge')  
                res.send(response)
               }

        }


   }catch(err){ 
       console.log(err)
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
        let {id, action} = req.body;
        let empId = req.user.user_id;

        const challengeDetails = await Challenge.findOne({_id: id}); 

        const recentDate = new Date();

        const strDate = dateLib.format(recentDate,'YYYY-MM-DD')

        const recentDateYMD =  strDate+ 'T00:00:00.000Z'

       console.log(recentDateYMD, challengeDetails.start);

        if(recentDateYMD >= challengeDetails.start){
            response = webResponse(200, false, 'Challenge has been already started')  
            res.send(response);
            return;
        }

        let result = {};
        if(action === 'accept'){

            if(challengeDetails.participants.indexOf(empId) >=0){
                response = webResponse(200, false, 'Already Joined')  
                res.send(response);
                return;
            }else{
                 result = await Challenge.updateOne({_id: id}, {$push: {'participants': empId}, $pull: {'invites': empId}}, {new: true}); 
            }

        }else{
             result = await Challenge.updateOne({_id: id}, {$pull: {'invites': empId}, $push: {'rejects': empId}}, {new: true}); 
        }

       
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
    
        const result =  await Challenge.aggregate([
            {$match: {userId: req.body.id}},
             { "$lookup": {

                "from": "activities",
                "let": { "challengeId": "$_id" },
                "pipeline": [
                  { "$addFields": { "challengeId": { "$toObjectId": "$challengeId" }}},
                  { "$match": { "$expr": { "$eq": [ "$challengeId", "$$challengeId" ] } } }
                ],
                "as": "activitiesObj"
             }},
            { "$group": {
                "_id": "$_id",
                "userId": { $first: "$userId"},
                "employeeId": { $first: "$employeeId"},
                "type": { $first: "$type"},
                "orgType": { $first: "$orgType"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "status": { $first: "$status"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activitiesObj"},
                "invites": {$first: "$invites"}
            }},
            {
                "$sort": {
                    _id: -1
                }
              }
        ])



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
			query = {orgType: {$ne: 'admin'}, rejects: {$nin: [empId]}, $or: [{userId: String(employeeDetails.organizationId)}, {userId: String(empId)}]}
		}else{
			query = {orgType: {$ne: 'org'}, rejects: {$nin: [empId]}}
		}

        const newChallenges =  await Challenge.aggregate([
            {$match: query},
            {$match: {status: 'new'}},
            {"$unwind": {path: "$participants", preserveNullAndEmptyArrays:true}},
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
                "employeeId": { $first: "$employeeId"},
                "type": { $first: "$type"},
                "orgType": { $first: "$orgType"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "status": { $first: "$status"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activitiesObj"},
                "participantsObjects": { "$addToSet": "$participantsObjects" },
                "invitesObjects": { "$addToSet": "$invitesObjects" }
            }},
            {
                "$sort": {
                    _id: -1
                }
              }
        ])

        const onGoingChallenges =  await Challenge.aggregate([  
            {$match: query},
            {$match: {status: 'ongoing'}},
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
                "employeeId": { $first: "$employeeId"},
                "type": { $first: "$type"},
                "orgType": { $first: "$orgType"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "status": { $first: "$status"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activitiesObj"},
                "participantsObjects": { "$addToSet": "$participantsObjects" },
                "invitesObjects": { "$addToSet": "$invitesObjects" }
            }},
            {
                "$sort": {
                    _id: -1
                }
              }
        ])

        const completedChallanges =  await Challenge.aggregate([
            {$match: query},
            {$match: {status: 'completed'}},
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
                "employeeId": { $first: "$employeeId"},
                "type": { $first: "$type"},
                "orgType": { $first: "$orgType"},
                "title": { $first: "$title"},
                "description": { $first: "$description"},
                "pic": { $first: "$pic"},
                "start": { $first: "$start"},
                "end": { $first: "$end"},
                "status": { $first: "$status"},
                "duration": {$first : "$duration"},
                "winners": {$first: "$winners"},
                "employeeId": {$first: "$employeeId"},
                "dailyStepLimit": {$first: "$dailyStepLimit"},
                "weightType": {$first: "$weightType"},
                "targetWeight": {$first: "$targetWeight"},
                "targetBMI": {$first: "$targetBMI"},
                "activities": {$first: "$activitiesObj"},
                "participantsObjects": { "$addToSet": "$participantsObjects" },
                "invitesObjects": { "$addToSet": "$invitesObjects" }
            }},
            {
                "$sort": {
                    _id: -1
                }
              }
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

    }catch(err){
         console.log(err)
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
                "activities": {$first: "$activities"},
                "participantsObjects": { "$addToSet": "$participantsObjects" },
                "invitesObjects": { "$addToSet": "$invitesObjects" }
            }},
            {
                "$sort": {
                    _id: -1
                }
              }
        ])

    
        setTimeout(() => {
                response = webResponse(202, true, newChallenges)  
                res.send(response)
        }, 200);

    }catch(err){ console.log(err)
        res.send(err)
    };
});


router.post('/challengeDetail', auth, async(req, res) => {
    try{ 
        let {id} = req.body;
        let empId = req.user.user_id;
        const challenge = await Challenge.findOne({_id: new ObjectID(id)})

        if(challenge !== null){
            let date1 = new Date(challenge.start);
			let date2 = new Date(challenge.end);
		
			let difference =  date2.getTime() - date1.getTime()

			let days = Math.ceil(difference / (1000 * 3600 * 24));


            let participants = [];
            challenge.participants.forEach( async (key) => {
                const employee = await Employee.findOne({_id: key});
                participants.push(employee);
            })

            let invites = [];
            challenge.invites.forEach( async (key) => {
                const employee = await Employee.findOne({_id: key});
                invites.push(employee);
            })


            const activitesList = await Activity.find({challengeId: id}).sort({'activityDate': 1});
            const userActivities = [];
 
            if(activitesList.length > 0){
                activitesList.forEach( async (key) => {
                    console.log('keykey', key)
                 let activityDone = await challengeMind.findOne({employeeId: empId, activityId: key._id, challengeId: id});
                 let activityDict =  {
                    "_id": key._id,
                    "challengeId": key.challengeId,
                    "title": key.title,
                    "description": key.description,
                    "attachement": key.attachement,
                    "completed": activityDone !== null ? true : false,
                    "date": activityDone !== null ? dateLib.format(activityDone.createdAt,'YYYY-MM-DD')  : "",
                    "activityDate": key.activityDate ? dateLib.format(new Date(key.activityDate),'YYYY-MM-DD')  : "", 
                    "realDate": key.activityDate ? new Date(key.activityDate) : "", 
                }
                userActivities.push(activityDict)
                })
            }

            let stepsDetails = await challengeStepTracker.find({employeeId: empId, challengeId: id});
            let allSteps = [];
            let totalSteps = 0;
            let totalkm = 0;
            let totalCalories = 0;
            let totalDuration = 0;
            let count = 0

            function getStepData(){

                const promise = new Promise((res, rej) => {

                    if(stepsDetails.length > 0){

                        stepsDetails.forEach( async (key) => {
                            totalSteps = totalSteps + Number(key.steps);
                            totalkm = totalkm + Number(key.km);
                            totalCalories = totalCalories + Number(key.calories);
                            
                            if(key.duration != '00:00:00' && key.duration != '00:00'){
                                totalDuration = totalDuration + await hhmmss(key.duration, 'seconds')
                            }
        
                            count++;
        
                            if(count === stepsDetails.length){
                                totalDuration = await hhmmss(totalDuration, 'hms');

                                res({
                                    totalSteps : totalSteps, 
                                    totalkm: totalkm, 
                                    totalCalories : totalCalories, 
                                    totalDuration : totalDuration, 
                                  })


                            }
                        })
        
                    }else{
                        res({
                            totalSteps : 0, 
                            totalkm: 0, 
                            totalCalories : 0, 
                            totalDuration : 0, 
                       })
                    }



                })

                return promise

            }



            function getAllStepData(){

                const promise = new Promise((res, rej) => {
                  
                    if(stepsDetails.length > 0){
                        let steps = 0;	
                        let noOfFound = 0;

                        let startDate = new Date(challenge.start);
                        let endDate = new Date(challenge.end);
                        let nowDate = new Date();

                        if(startDate > nowDate) return res([])
                        let endingDate = nowDate >= endDate ? endDate : nowDate

                        console.log(startDate, endingDate);

                        for(i = startDate; i <= endingDate;  i.setDate(i.getDate() + 1)) { 

                            let found = 0; 
                            for( let j = 0, len = stepsDetails.length; j < len; j++ ) { 
                               var stepTrackerData = {};
                                if( stepsDetails[j]['date'] == dateLib.format(i, 'YYYY-MM-DD')) {
                                    found = 1;
                                    stepTrackerData = {
                                        totalSteps : stepsDetails[j].steps, 
                                        totalkm: stepsDetails[j].km, 
                                        totalCalories : stepsDetails[j].calories, 
                                        totalDuration : stepsDetails[j].duration, 
                                        'date' : dateLib.format(i, 'YYYY-MM-DD')
                                    };
                                    break;
                                } 
                            }

                            if(found == 0) {
                                step = {
                                    totalSteps : 0, 
                                    totalkm: 0, 
                                    totalCalories : 0, 
                                    totalDuration : '00:00:00', 
                                    'date' : dateLib.format(i,'YYYY-MM-DD')
                                }
                                allSteps.push(step);
                            }   else{
                                noOfFound = Number(noOfFound)+ 1
                                steps = Number(stepTrackerData.steps) + Number(steps)
                                allSteps.push(stepTrackerData);
                            }

        
                            const endate_ = dateLib.format(endingDate,'YYYY-MM-DD')
                            const endate__ =  endate_+ 'T00:00:00.000Z'

                            const i_ = dateLib.format(i,'YYYY-MM-DD')
                            const i__ =  i_+ 'T00:00:00.000Z'

                            console.log(String(i__), String(endate__))
                            if(String(i__) == String(endate__)){
                                res(allSteps)
                            }

                        }

                    }else{
                        res([])
                    }

                })

                return promise

            }
 
          
            let allStepData = await getAllStepData()

        
            let today =  dateLib.format(new Date(), 'YYYY-MM-DD');
            const todayStepsDetails = await challengeStepTracker.findOne({ date: today,  employeeId: empId, challengeId: id});
            let todayStepsDetailsObj  = {
                totalSteps : 0, 
                totalkm: 0, 
                totalCalories : 0, 
                totalDuration : 0, 
            }
            if(todayStepsDetails !== null){
                todayStepsDetailsObj = {
                    totalSteps : todayStepsDetails.steps, 
                    totalkm: todayStepsDetails.km, 
                    totalCalories : todayStepsDetails.calories, 
                    totalDuration : todayStepsDetails.duration, 
                }
            }


            let challengeDetails = {
                "_id": challenge._id,
                "userId": challenge.userId,
                "type": challenge.type,
                "title": challenge.title,
                "description": challenge.description,
                "pic": challenge.pic,
                "start": challenge.start,
                "end": challenge.end,
                "duration": days,
                "winners": challenge.winners,
                "employeeId": challenge.employeeId,
                "dailyStepLimit": challenge.dailyStepLimit,
                "weightType": challenge.weightType,
                "targetWeight": challenge.targetWeight,
                "targetBMI": challenge.targetBMI,
                "activities": arraySort(userActivities,  ['realDate'], {reverse: false}) ,
                "participantsObjects": participants,
                "invitesObjects": invites,
                "stepsData": await getStepData(),
                "todayStepsDetails": todayStepsDetailsObj,
                "allStepData": allStepData
            }

            setTimeout(() => {
                response = webResponse(202, true, challengeDetails)  
                res.send(response)
        }, 200);


        }else{
            response = webResponse(203, false, "Challenge Not Found.")  
            res.send(response)
        }



    }catch(err){
         console.log(err)
        res.send(err)
    };
});


router.post('/weightChallengeDetail', auth, async(req, res) => {

    let {id} = req.body;
    let empId = req.user.user_id;
    const challenge = await Challenge.findOne({_id: new ObjectID(id)});
    const recentWeight = await challengeWeight.findOne({ employeeId: empId}).sort({date:-1});

    let weightList = await challengeWeight.find({employeeId: empId, challengeId: id});

    const employeeDetails = await Employee.findById(empId);

    async function noData(){
        let data = {}; 
        data.weightList = [];
        data.recentWeight = 'No Data';
        if(challenge.weightType === "healthy"){
            data.BMI = {}
        }

        return data;
    }

        async function BMI_CAL(WEIGHT){
                let result = {};
                let height = employeeDetails.height;
                if(!employeeDetails.height) return 0;
                let weight = WEIGHT * 0.45359237;
                let BMI  = (weight / ((height * height) / 10000)).toFixed(2);
                result.BMI = BMI;

                if(BMI < 18.5){
                    result.status = 'Underweight'
                    result.innerText = "BMI indicates that you are underweight, so you may need to put on some weight. You are recommended to ask your doctor or a dietitian for advice";    
                }else if((BMI > 18.5) && (BMI < 24.9)){
                    result.status = 'Healthy Weight'
                    result.innerText = "Your BMI falls within the normal or healthy weight range";
                }else if((BMI > 25) && (BMI < 29.9 )){
                    result.status = 'Overweight'
                    result.innerText = "Your BMI falls within the overweight, so you may need to loose some weight. You are recommended to ask your doctor or a dietitian for advice";
                }else{
                    result.status = 'Obese'
                    result.innerText = "Your BMI falls within the obese range, so you may need to loose weight. You are recommended to ask your doctor or a dietitian for advice";
                }

                return result;
        }
     

        let nowDate = new Date();
        nowDate.setDate(nowDate.getDate() - 6);

        var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    
        var oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
        
        var oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 29);
   
        var date = new Date();
        
        async function weightLIST(){

            let promise = new Promise( async (resolve, reject) => {

                if(weightList.length === 0){
                     resolve([])
                }else{
                    
                    var weightArray = [];		
                    var i = 0;
        
                    weightList.forEach(async (col) => {
                                   
                        if(i == 0) {
                            let BMI = await BMI_CAL(col.weight);
                            weight = {
                                'date' : dateLib.format(col.date,'YYYY-MM-DD'),
                                'weight' : col.weight,
                                'day' :  days[col.date.getDay()],
                                'difference': "0",
                                'weightLine':''
                            }
                            if(challenge.weightType === "healthy") weight.BMI = BMI.status
                        } else{
                            var difference = col.weight - weightList[i-1].weight;
                            if(difference > 0) {
                                var line = convertIntoTwoDecimal(difference)+" kilogram over weight."
                            } else {
                                var line = convertIntoTwoDecimal(difference)+" kilogram under weight."
                            }
                            let BMI = await BMI_CAL(col.weight);
                            weight = {
                                'date' :  dateLib.format(col.date,'YYYY-MM-DD'),
                                'weight' : col.weight,
                                'day' :  days[col.date.getDay()],
                                'difference': convertIntoTwoDecimal(difference),
                                'weightLine': line
                            }
                            if(challenge.weightType === "healthy") weight.BMI = BMI.status
                        }
                        
                        weightArray.push(weight);
                        i++;
         
                        
                        if(i === weightList.length){
                        
                            let startDate = new Date(challenge.start);
                            let endDate = new Date(challenge.end);
                            let nowDate = new Date();
                            let endingDate = nowDate >= endDate ? endDate : nowDate

                            var weightFinalArray = [];
                            let weight = {}
                            for(i = startDate; i <= endingDate;  i.setDate(i.getDate() + 1)) {
                                
                                let found = 0; 
                                for( let j = 0, len = weightArray.length; j < len; j++ ) { 
                                    console.log(weightArray[j]['date'], dateLib.format(i, 'YYYY-MM-DD'))
                                   var weightData = {};
                                    if( weightArray[j]['date'] == dateLib.format(i, 'YYYY-MM-DD')) {
                                        found = 1;
                                        weightData = weightArray[j];
                                        break;
                                    } 
                                }
    
                                if(found == 0) {
                                    weight = {
                                        'date' : dateLib.format(i,'YYYY-MM-DD'),
                                        'weight' : "0",
                                        'day' : days[i.getDay()],
                                        'difference': "0",
                                        'weightLine':''
                                    }
                                    if(challenge.weightType === "healthy") weight.BMI = null

                                    weightFinalArray.push(weight);
                                }   else{
                                    weightFinalArray.push(weightData);
                                }
    
            
                                const endate_ = dateLib.format(endingDate,'YYYY-MM-DD')
                                const endate__ =  endate_+ 'T00:00:00.000Z'
    
                                const i_ = dateLib.format(i,'YYYY-MM-DD')
                                const i__ =  i_+ 'T00:00:00.000Z'
    
                                if(String(i__) == String(endate__)){
                                    resolve(weightFinalArray)
                                }
  
                            }
                        }
                    });

                }
                
            })

            return promise;
        }


        let date1 = new Date(challenge.start);
        let date2 = new Date(challenge.end);
    
        let difference =  date2.getTime() - date1.getTime()

        let totalDays = Math.ceil(difference / (1000 * 3600 * 24));

        let participants = [];
        challenge.participants.forEach( async (key) => {
            const employee = await Employee.findOne({_id: key});
            participants.push(employee);
        })

        let invites = [];
        challenge.invites.forEach( async (key) => {
            const employee = await Employee.findOne({_id: key});
            invites.push(employee);
        })

        let weeklyResult = await weightLIST();

        let challengeDetails = {
            "_id": challenge._id,
            "userId": challenge.userId,
            "type": challenge.type,
            "title": challenge.title,
            "description": challenge.description,
            "pic": challenge.pic,
            "start": challenge.start,
            "end": challenge.end,
            "duration": totalDays,
            "winners": challenge.winners,
            "employeeId": challenge.employeeId,
            "dailyStepLimit": challenge.dailyStepLimit,
            "weightType": challenge.weightType,
            "targetWeight": challenge.targetWeight,
            "targetBMI": challenge.targetBMI,
            "participantsObjects": participants,
            "invitesObjects": invites,
            "BMI": recentWeight !== null ? await BMI_CAL(recentWeight.weight) : 0,
            "weightList": weeklyResult.reverse(),
            "recentWeight": recentWeight !==null ? recentWeight.weight : null,
        }
 
        response = webResponse(202, true, challengeDetails)  
        res.send(response);
        return;

})


router.post('/mindLeaderboard', auth, async(req, res) => {
    try{ 

        let {id} = req.body;
        let empId = req.user.user_id;
        const challenge = await Challenge.findOne({_id: new ObjectID(id)})
        const participants = challenge.participants;

        if(participants.length > 0){

            let participantsScores = [];
    
            participants.forEach( async (key) => {
                 let activityDone = await challengeMind.find({employeeId: key, challengeId: id});
                 console.log('activityDone', activityDone)
                 const employeeDetails = await Employee.findOne({_id: key});
                 let activityDict =  {
                    firstName: employeeDetails.firstName,
                    lastName: employeeDetails.lastName,
                    picture: employeeDetails.picture,
                    userId: employeeDetails._id,
                    totalActivities: activityDone.length
                }

                participantsScores.push(activityDict)
                })
        
            setTimeout(() => {
                   let final =  participantsScores.sort(function(a, b) {
                        return parseFloat(a.totalActivities) - parseFloat(b.totalActivities);
                    });
                    response = webResponse(202, true, final.reverse())  
                    res.send(response)
            }, 200);

        }else{
            response = webResponse(202, true, [])  
            res.send(response)
        }

    }catch(err){
         console.log(err)
        res.send(err)
    };
});



router.post('/stepsLeaderboard', auth, async(req, res) => {
    try{ 

        let {id} = req.body;
        const challenge = await Challenge.findOne({_id: new ObjectID(id)})
        const participants = challenge.participants;

        if(participants.length > 0){

            let participantsScores = [];
    
            participants.forEach( async (key) => {
                 let stepsList = await challengeStepTracker.find({employeeId: key, challengeId: id});

                 console.log('stepsList', stepsList)
                 let stepsCount = 0;
                 stepsList.forEach( (key) => {
                    stepsCount = stepsCount + Number(key.steps)
                 })
               
                 const employeeDetails = await Employee.findOne({_id: key});
                 let activityDict =  {
                    firstName: employeeDetails.firstName,
                    lastName: employeeDetails.lastName,
                    picture: employeeDetails.picture,
                    userId: employeeDetails._id,
                    steps: stepsCount
                }

                participantsScores.push(activityDict)
                })
        
            setTimeout(() => {
                   let final =  participantsScores.sort(function(a, b) {
                        return parseFloat(a.steps) - parseFloat(b.steps);
                    });
                    response = webResponse(202, true, final.reverse())  
                    res.send(response)
            }, 200);

        }else{
            response = webResponse(202, true, []) 
        }

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

        let newMind = new challengeMind({
            employeeId: empId,
            activityId: activityId,
            challengeId: activityDetails.challengeId
        })

        let result = await newMind.save();

        response = webResponse(207, true, 'Activity has been added successfully.')  
        res.send(response)

    }catch(err){ console.log(err)
        res.send(err)
    }
 });



 router.post('/addStep', auth, async(req, res) => {
	try{ 

        const {challengeId, steps, km, calories, duration} = req.body;
        var empId = req.user.user_id;
		let challenge = await Challenge.findOne({_id: challengeId});
        let date = new Date();
        let userTodaySteps = await challengeStepTracker.findOne({ date: dateLib.format(date, 'YYYY-MM-DD'),  employeeId: empId});
        let dailyLimit = challenge.dailyStepLimit;

        if(userTodaySteps !== null){
            if(userTodaySteps.steps >= dailyLimit) {
                response = webResponse(203, true, 'Your have reached to daily limit of steps in this challenge.')  
                res.send(response)
                return 
            }
        }


    var stepTarget = await EmpStepTarget.findOne({ employeeId: empId}).sort({date:-1});

    if(stepTarget !== null){

        let stepTargetSteps = (stepTarget.steps + steps) <= stepTarget.step_target ?  (stepTarget.steps + steps) : stepTarget.step_target;
        let targetDuration = 0;
        if(stepTarget.duration != '00:00:00' && stepTarget.duration != '00:00'){
            targetDuration = await hhmmss(stepTarget.duration, 'seconds') + await  hhmmss(duration, 'seconds');
        }else{
            targetDuration = await  hhmmss(duration, 'seconds')
        }
    
        await EmpStepTarget.updateOne({_id: stepTarget._id}, {$set: {steps: stepTargetSteps, duration: await hhmmss(targetDuration, 'hms')}}, {new: true});
    }

        let today =  dateLib.format(new Date(), 'YYYY-MM-DD');
        const stepTrackerDetails = await StepTracker.findOne({ date: today,  employeeId: empId});

        if (stepTrackerDetails) {  

            let newDuration = 0

            if(stepTrackerDetails.duration != '00:00:00' && stepTrackerDetails.duration != '00:00'){
                newDuration = await hhmmss(stepTrackerDetails.duration, 'seconds') + await hhmmss(duration, 'seconds');
            }else{
                newDuration = await hhmmss(duration, 'seconds');
            }
    
            stepTrackerDetails.km = Number(stepTrackerDetails.km) + Number(km);
            stepTrackerDetails.steps = Number(stepTrackerDetails.steps) + Number(steps);
            stepTrackerDetails.calories = Number(stepTrackerDetails.calories) + Number(calories);
            stepTrackerDetails.duration = await hhmmss(newDuration, 'hms');

            const a1 = await stepTrackerDetails.save()

        } else{
            const stepTracker = new StepTracker({
                employeeId: empId,
                steps: steps,
                km: km,
                calories: calories,
                duration: duration,
                date: today
            })

            const a1 = await stepTracker.save()
        }
        

        const challengeStepTrackerDetails = await challengeStepTracker.findOne({ date: today,  employeeId: empId, challengeId: challengeId});


        if (challengeStepTrackerDetails) {  

            let newDuration = 0

            if(challengeStepTrackerDetails.duration != '00:00:00' && challengeStepTrackerDetails.duration != '00:00'){
                newDuration = await hhmmss(challengeStepTrackerDetails.duration, 'seconds') + await hhmmss(duration, 'seconds');
            }else{
                newDuration = await hhmmss(duration, 'seconds');
            }
    
            challengeStepTrackerDetails.km = Number(challengeStepTrackerDetails.km) + Number(km);
            challengeStepTrackerDetails.steps = Number(challengeStepTrackerDetails.steps) + Number(steps);
            challengeStepTrackerDetails.calories = Number(challengeStepTrackerDetails.calories) + Number(calories);
            challengeStepTrackerDetails.duration = await hhmmss(newDuration, 'hms');

            const a1 = await challengeStepTrackerDetails.save()
            response = webResponse(202, true, a1)  
            res.send(response);
            return;

        } else{
            const stepTracker = new challengeStepTracker({
                employeeId: empId,
                steps: steps,
                km: km,
                calories: calories,
                duration: duration,
                date: today,
                challengeId: challengeId
            })

            const a1 = await stepTracker.save()
            response = webResponse(202, true, a1) ;
            console.log('response', response) 
            res.send(response);
            return;
        }
 	
    }catch(err){ 
		console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})



router.post("/addWeight", auth, async(req, res) => { 
    try{ 

        const {weight, date , heightType, height, challengeId} = req.body;
           var empId = req.user.user_id;
    
  
          if(height){
               await Employee.updateOne({_id: empId}, {$set: {height: height, heightType: heightType}}, {new: true});
          }


          ///// add personal weight
  
          const weightDetails = await Weight.findOne({ date: date,  employeeId: empId});

          if (weightDetails) {  
              weightDetails.weight =  weight
              const a1 = await weightDetails.save()
          } else{
            let newWeight = new Weight({
                employeeId: empId,
                weight: weight,
                date: date
              })
              const a1 = await newWeight.save()
          }

          ///// add personal weight
          const challengeWeight_ = await challengeWeight.findOne({ date: date,  employeeId: empId, challengeId: challengeId});

          if (challengeWeight_) {  
            challengeWeight_.weight =  weight
            const a1 = await challengeWeight_.save()
            } else{
            let newWeight = new challengeWeight({
                employeeId: empId,
                weight: weight,
                date: date,
                challengeId: challengeId
                })
                const a1 = await newWeight.save()
            }

          response = webResponse(200, true, "Weight saved")  
          res.send(response);
          return;
      } catch(err){   console.log(err)
          response = webResponse(403, false, err)  
          res.send(response)
          return;
      }
    
  }); 


  router.post('/weightLeaderboard', auth, async(req, res) => {
    try{ 

        let {id} = req.body;
        const challenge = await Challenge.findOne({_id: new ObjectID(id)})
        const participants = challenge.participants;

        if(participants.length > 0){

            let participantsWeights = [];
            let allweightsLs = []
            participants.forEach( async (key) => {
                const employeeDetails = await Employee.findOne({_id: key});
                 let weightList = await challengeWeight.find({employeeId: key, challengeId: id}).sort({date: -1});
                 let dict = {
                   userId: key,
                   weights: weightList,
                   firstName: employeeDetails.firstName,
                   lastName: employeeDetails.lastName,
                   picture: employeeDetails.picture,
                 }
                 allweightsLs.push(dict)
                 let recentWeight = weightList.length > 0 ? weightList[0] : {weight: 0};
            
       
                 let activityDict =  {
                    firstName: employeeDetails.firstName,
                    lastName: employeeDetails.lastName,
                    picture: employeeDetails.picture,
                    userId: employeeDetails._id,
                    weigtht: recentWeight.weight,
                    date: recentWeight.weight!=0 ? dateLib.format(recentWeight.date,'YYYY-MM-DD') : '' 
                }
                participantsWeights.push(activityDict);
                })
        
            setTimeout(async () => {
                   let final = {}
                   let _list =  participantsWeights.sort(function(a, b) {
                        return parseFloat(a.weigtht) - parseFloat(b.weigtht);
                    });

                    final.list = _list
                    final.winners = [];

                    const recentDate = new Date();
                    const strDate = dateLib.format(recentDate,'YYYY-MM-DD')
                    const recentDateYMD =  strDate + 'T00:00:00.000Z';


                    async function getWinners(){

                        let promise = new Promise( async (res, rej) => {

                            if(allweightsLs.length === 0) res([])

                            let totalWeights = []
                            allweightsLs.forEach((key) => {
    
                                let dist = {
                                    userId: key.userId,
                                    firstName: key.firstName,
                                    lastName: key.lastName,
                                    picture: key.picture,
                                }
                                
                                let i = 0;
                                let D = 0
                                if(key.weights.length !== 0){
    
                                    key.weights.forEach( (key_) => {
                                       
                                        if(key.weights[i + 1] !== undefined && key.weights[i + 1] !== null){
                                            let diff = key.weights[i + 1].weight -  key_.weight
                                            console.log(D, diff)
                                            D = D + diff
                                        }
    
                                        i++
                                        if(key.weights.length === i) dist.weight = D
    
                                 })
    
                                }else{
                                    dist.weight = 0
                                }
    
                                totalWeights.push(dist)
     
                            let winners = [];
                            let cont__ = 0;
                            
                            totalWeights.forEach( async (key) => {
    
                                if(challenge.weightType === 'gain'){
    
                                    if(key.weight >= challenge.targetWeight){
                                        winners.push(key)
                                    }
                                }
    
                                if(challenge.weightType === 'loss'){
                                    if(key.weight <= challenge.targetWeight){
                                        winners.push(key)
                                    }
                                }
    
                                if(challenge.weightType === 'healthy'){
                                    const employeeDetails = await Employee.findOne({_id: key.userId});
                                    let height = employeeDetails.height;
                                    let weight = key.weight * 0.45359237;
                                    let BMI  = (weight / ((height * height) / 10000)).toFixed(2);
                                    BMIDiff = challenge.targetBMI - BMI;
                                    key.diff = Math.abs(BMIDiff)
                                    key.BMI = BMI
    
                                    winners.push(key)
                                }
    
                                cont__++;
                                if(cont__ === totalWeights.length){
                                     res(challenge.weightType === 'healthy' ? arraySort(winners,  ['diff'], {reverse: true}) : winners)
                                    }

                            })
    
                         });

                        })

                        return promise;

                    }
 
                    if(challenge.status === "completed"){
                        final.winners = await getWinners();
                    }
                    
                    response = webResponse(202, true, final)  
                    res.send(response)
            }, 200);

        }else{
            response = webResponse(202, true, []) 
        }

    }catch(err){
         console.log(err)
        res.send(err)
    };
});




/////=========================////////


function hhmmss(val, type){

	console.log(val, type)
	const promise = new Promise( (resolve, reject) => {
		if(type === 'hms'){
			const time = new Date( Number(val) * 1000).toISOString().split("T")
		    resolve(time[1].split(".")[0]) 
		}else{
			var a = val.split(':');  
			var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
			resolve(seconds)
		}
	})

return promise
}


function daysDifference(start, end){
    let date1 = new Date(start);
    let date2 = new Date(end);

    let difference =  date2.getTime() - date1.getTime()

    return Math.ceil(difference / (1000 * 3600 * 24));
}

module.exports = router