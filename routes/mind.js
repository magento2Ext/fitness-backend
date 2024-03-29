const express = require("express");
const router = express.Router()
const auth = require("../middleware/auth");
const ObjectID = require('mongodb').ObjectID;
const Employee = require('../models/employee');
const sendFCM = require('./fcm');
const CronJob = require('cron').CronJob;
const errors = ['', '0', 0, null, undefined];
const dateLib = require('date-and-time');
const arraySort = require('array-sort')
const Mind = require('../models/mind')
 
router.post('/addMood', auth, async(req, res) => {
    try{ 
        
        let {mood, date, moodScore} = req.body;
        let empId = req.user.user_id;

        const isMood = await Mind.findOne({ date: date,  employeeId: empId});

        if(isMood === null){

            const weight = new Mind({
                employeeId: empId,
                date: date,
                mood: mood,
                moodScore: moodScore
               });

            const result =  weight.save();    
            if(result){
                response = webResponse(200, true, "Mood saved")  
                res.send(response);
            }

        }else{
            const result = await Mind.updateOne({_id: isMood._id}, {$set: {mood: mood,  moodScore: moodScore}}, {new: true});
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


  router.post('/mindActivity', auth, async(req, res) => {
    try{ 
    
        let empId = req.user.user_id;

        const moodList = await Mind.find({employeeId: empId});

        if(moodList.length !== 0){

            async  function getWeeklyActivity(){


                let promise = new Promise( async (res, rej) => {


                    let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                    let date = new Date();
                    
                    let dayOfWeek = date.getDay();
                    
                    let startDate = date.setDate(date.getDate() - (dayOfWeek + 1) )
                    
                    let firstDay = new Date(startDate)
        
                    let moodList = [];
                    for(let i = 1; i <= 7; i++){
                        let newDate = firstDay.setDate(firstDay.getDate() + 1)
                        let DMY = dateLib.format(new Date(newDate), 'DD-MM-YYYY');
                        let isMood = await Mind.findOne({employeeId: empId, date: DMY});
                        let dict = {
                            mood: isMood !== null ? isMood.mood : "No data",
                            moodScore: isMood !== null ? isMood.moodScore : "0",
                            date: DMY,
                            day: days[(new Date(newDate)).getDay()]
                        }
                        moodList.push(dict);
                        firstDay = new Date(firstDay)
                        if(i === 7) res(moodList)
                       
                    }

                })

                return promise;
            }


           async function getMonthlyActivity(){

                let promise = new Promise(async (res, rej) => {

                    let today = new Date();
                    let daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

                    let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                    let month = Number(today.getMonth())
                    let firstDay = new Date(today.getFullYear()+'-'+(month+1)+'-'+'01'+'T00:00:00.000+00:00');

                    let moodList = [];
                    for(let i = 1; i <= daysInMonth; i++){
                        let newDate 
                        if(i === 1) newDate = firstDay
                        else newDate = firstDay.setDate(firstDay.getDate() + 1)
                        
                        let DMY = dateLib.format(new Date(newDate), 'DD-MM-YYYY');
                        let isMood = await Mind.findOne({employeeId: empId, date: DMY});
                        let dict = {
                            mood: isMood !== null ? isMood.mood : "No data",
                            moodScore: isMood !== null ? isMood.moodScore : "0",
                            date: DMY,
                            day: days[(new Date(newDate)).getDay()],
                            date_: new Date(newDate)
                        }
                        moodList.push(dict);
                        firstDay = new Date(firstDay)
                        if(i === daysInMonth) res(moodList)
                       
                    }

                })

                return promise;
            }


            let DATA = {weeklyActivity: await getWeeklyActivity(), monthlyActivity: await getMonthlyActivity(), allActivity: arraySort(moodList,  ['createdAt'], {reverse: true})}
            response = webResponse(202, true, DATA)  
            res.send(response);

    
        }else{
            response = webResponse(202, true, {allActivity: [], weeklyActivity: [], monthlyActivity: []})  
            res.send(response);
        }

      } catch(err){   console.log(err)
          response = webResponse(403, false, err)  
          res.send(response)
          return;
      }
    
  }); 

  module.exports = router