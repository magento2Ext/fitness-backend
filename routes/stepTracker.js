 const express = require("express");
 const router = express.Router()
 const StepTracker = require('../models/step_tracker')
 const dateLib = require('date-and-time')
 require('../functions')
 const auth = require("../middleware/auth");
 
 router.post('/save', auth, async(req,res) => {
	try{ 
	    var empId = req.user.user_id;
		var today =  dateLib.format(new Date(),'YYYY-MM-DD');
		const stepTracker = new StepTracker({
			employeeId: empId,
			steps: req.body.steps,
			km: req.body.km,
			calories: req.body.calories,
			duration: req.body.duration,
			date: today
		})
		
		const stepTrackerDetails = await StepTracker.findOne({ date: today,  employeeId: req.user.user_id});
		if (stepTrackerDetails) {  
			stepTrackerDetails.km =  req.body.km
			stepTrackerDetails.steps =  req.body.steps
			stepTrackerDetails.calories =  req.body.calories
			stepTrackerDetails.duration =  req.body.duration
			const a1 = await stepTrackerDetails.save()
			response = webResponse(202, true, a1)  
			res.send(response);
			return;
		} else{
			const a1 = await stepTracker.save()
			response = webResponse(202, true, a1)  
			res.send(response);
			return;
		}		
    }catch(err){ 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
})


 router.post('/list', auth, async(req,res) => {
	var endDate = new Date(); 
	
	var startDate = new Date();
	startDate.setDate(startDate.getDate() - 29);
	
	const stepTrackerList = await StepTracker.find({  employeeId: req.user.user_id,
			date: {
				$gte: dateLib.format(startDate,'YYYY-MM-DD'),
				$lte: dateLib.format(endDate,'YYYY-MM-DD')
			}
		}).sort({date:1})
		
    var stepTrackerDetailsToday = await StepTracker.findOne({ date: dateLib.format(endDate,'YYYY-MM-DD'),  employeeId: req.user.user_id});
	if(!stepTrackerDetailsToday) {
		stepTrackerDetailsToday = {
			'date' : dateLib.format(endDate,'YYYY-MM-DD'),
			'steps' : "0",
			'km' : "0",
			'calories':"0",
			'duration':'00:00:00'
		}
	}
	
	var tracker = await StepTracker.aggregate([
			{ $group: {
				_id: '$employeeId',
				stepAvg: { $avg: '$steps'}
			}}
		], function (err, results) {
			if (err) {
				console.error(err);
			} else {
				console.log(results);
			}
		}
	);
	
	var stepFinalArray = [];
		var steps = 0;	
		var noOfFound = 0;
		for(i=startDate; i<=endDate;  i.setDate(i.getDate() + 1)) { 
			var found = 0; 
			for( var j = 0, len = stepTrackerList.length; j < len; j++ ) { 
			   var stepTrackerData = '';
			    if( stepTrackerList[j]['date'] == dateLib.format(i,'YYYY-MM-DD')) {
					found = 1;
					stepTrackerData = stepTrackerList[j];
					break;
				} 
			}
			if(found == 0) {
				step = {
					'date' : dateLib.format(i,'YYYY-MM-DD'),
					'steps' : "0",
					'km' : "0",
					'calories':"0",
					'duration':'00:00:00'
				}
				stepFinalArray.push(step);
			}   else{
				noOfFound = Number(noOfFound)+ 1
				steps = Number(stepTrackerData.steps) + Number(steps)
				stepFinalArray.push(stepTrackerData);
			}
		}
		
		var data = {}; 
		var avg = steps/noOfFound;
		data.totalSteps = steps.toString()
		data.avgStep = avg.toString()
		data.todayData = stepTrackerDetailsToday
		data.activity = stepFinalArray
		
		response = webResponse(201, true, data)  
		res.send(response);
		return;
})

 module.exports = router