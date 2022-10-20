const express = require("express");
const router = express.Router()
const auth = require("../middleware/auth");
const ObjectID = require('mongodb').ObjectID;
const Employee = require('../models/employee');
const sendFCM = require('./fcm');
const CronJob = require('cron').CronJob;
const errors = ['', '0', 0, null, undefined];
const dateLib = require('date-and-time');

const Mind = require('../models/mind')
 

router.post('/addMood', auth, async(req, res) => {
    try{ 
        
        let {mood, date} = req.body;
        let empId = req.user.user_id;

        const isMood = await Mind.findOne({ date: date,  employeeId: empId});

        if(isMood === null){

            const weight = new Mind({
                employeeId: empId,
                date: date,
                mood: mood
               });

            const result =  weight.save();    
            if(result){
                response = webResponse(200, true, "Weight saved")  
                res.send(response);
            }

        }else{
            const result = await Mind.updateOne({_id: isMood._id}, {$set: {mood: mood}}, {new: true});
            if(result){
                response = webResponse(200, true, "Weight saved")  
                res.send(response);
            }

        }

      } catch(err){   console.log(err)
          response = webResponse(403, false, err)  
          res.send(response)
          return;
      }
    
  }); 

  module.exports = router