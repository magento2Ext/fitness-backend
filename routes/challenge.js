const express = require("express");
const router = express.Router()
const Admin = require('../models/admin')
const Theme = require('../models/theme_setting')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Organization = require('../models/organization')
const Challenge = require('../models/challenge')
const auth = require("../middleware/auth");

router.post('/create', async(req, res) => {
   try{ 

       let {userId, type, title, description, pic, participants, start, end} = req.body;
       let data = {
                userId: userId,
                type: type,
                title: title,
                description: description,
                pic: pic,
                participants: participants,
                start: start,
                end: end
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

        let {id, userId, type, title, description, pic, participants, start, end} = req.body;
        let data = {
                 userId: userId,
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

 router.post('/invite', async(req,res) => {
    try{ 

        let {id, userId} = req.body;
        const result = await Challenge.updateOne({_id: id}, {$push: {invites: userId}}, {new: true}); 	 
       
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
    }
 });

 router.post('/accept', async(req,res) => {
    try{ 
        let {id, userId} = req.body;
        const result = await Challenge.updateOne({_id: id}, {$pull: {'invites': userId}, $push: {'participants': userId}}, {new: true}); 	 
       
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
        const _userId = new ObjectID(req.body.empId);
        const result =  await Challenge.aggregate([
            // Unwind the source
            { "$unwind": "$participants" },
            {$set: {participants: {$toObjectId: "$participants"} }},
            // Do the lookup matching
            { "$lookup": {
               "from": "employees",
               "localField": "participants",
               "foreignField": "_id",
               "as": "participantsObjects"
            }},
            // Unwind the result arrays ( likely one or none )
            { "$unwind": "$participantsObjects" },
            // Group back to arrays
            // { "$group": {
            //     "_id": "$_id",
            //     "participants": { "$push": "$participants" },
            //     "participantsObjects": { "$push": "$participantsObjects" }
            // }}
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


module.exports = router