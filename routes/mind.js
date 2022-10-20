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
                response = webResponse(200, true, "Mood saved")  
                res.send(response);
            }

        }else{
            const result = await Mind.updateOne({_id: isMood._id}, {$set: {mood: mood}}, {new: true});
            if(result){
                response = webResponse(200, true, "Mood saved")  
                res.send(response);
            }

        }

      } catch(err){   console.log(err)
          response = webResponse(403, false, err)  
          res.send(response)
          return;
      }
    
  }); 


  router.post('/mindHistory', auth, async(req, res) => {
    try{ 
    
        let empId = req.user.user_id;

        const moodList = await Mind.findOne({employeeId: empId});

        if(moodList.length !== 0){
            let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            let date = new Date();
            
            let dayOfWeek = date.getDay();
            
            let startDate = date.setDate(date.getDate() - (dayOfWeek + 1) )
            
            let firstDay = new Date(startDate)

            let moodList = [];
            let i = 0;
            for(let i = 1; i <= 7; i++){
                let newDate = firstDay.setDate(firstDay.getDate() + 1)
                let DMY = dateLib.format(new Date(newDate), 'DD-MM-YYYY');
                let isMood = await Mind.findOne({employeeId: empId, date: DMY});
                let dict = {
                    mood: isMood !== null ? isMood.mood : "No data",
                    date: DMY,
                    day: days[(new Date(newDate)).getDay()]
                }
                moodList.push(dict);
                firstDay = new Date(firstDay)
                if(i === 7) res.send(moodList)
               
            }

    
        }else{
  
        }

      } catch(err){   console.log(err)
          response = webResponse(403, false, err)  
          res.send(response)
          return;
      }
    
  }); 

  module.exports = router