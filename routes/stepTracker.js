 const express = require("express");
 const router = express.Router()
 const StepTracker = require('../models/step_tracker')
 const dateLib = require('date-and-time')
 const Employee = require('../models/employee')
 const EmpStepTarget = require('../models/employee_step_target')
 require('../functions')
 const auth = require("../middleware/auth");
 
 router.post('/save', auth, async(req, res) => {
	try{ 

		console.log('body', req.body)
		var stepTarget = await EmpStepTarget.findOne({ employeeId: req.user.user_id}).sort({date:-1});

		let stepTargetSteps = (stepTarget.steps + req.body.steps) <= stepTarget.step_target ?  (stepTarget.steps + req.body.steps) : stepTarget.step_target;
		let targetDuration = 0;
		if(stepTarget.duration != '00:00:00' && stepTarget.duration != '00:00'){
			targetDuration = await hhmmss(stepTarget.duration, 'seconds') + await  hhmmss(req.body.duration, 'seconds');
		}else{
			targetDuration = await  hhmmss(req.body.duration, 'seconds')
		}


		await EmpStepTarget.updateOne({_id: stepTarget._id}, {$set: {steps: stepTargetSteps, duration: await hhmmss(targetDuration, 'hms')}}, {new: true});
 
	    var empId = req.user.user_id;

		var today =  dateLib.format(new Date(), 'YYYY-MM-DD');

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
 
				let newDuration = 0
	
				if(stepTrackerDetails.duration != '00:00:00' && stepTrackerDetails.duration != '00:00'){
					newDuration = await hhmmss(stepTrackerDetails.duration, 'seconds') + await hhmmss(req.body.duration, 'seconds');
				}else{
					newDuration = await hhmmss(req.body.duration, 'seconds');
				}
	 
				stepTrackerDetails.km = Number(stepTrackerDetails.km) + Number(req.body.km);
				stepTrackerDetails.steps = Number(stepTrackerDetails.steps) + Number(req.body.steps);
				stepTrackerDetails.calories = Number(stepTrackerDetails.calories) + Number(req.body.calories);
				stepTrackerDetails.duration = await hhmmss(newDuration, 'hms');
	
				const a1 = await stepTrackerDetails.save()
				response = webResponse(202, true, a1)  
				res.send(response);
				return;
	
			} else{
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

router.post('/resetTarget', auth, async(req, res) => {
	try{ 

		var empId = req.user.user_id;
		let result = await EmpStepTarget.deleteMany({employeeId: empId});

		response = webResponse(202, true, result)  
		res.send(response);
		return;

    }catch(err){ 
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
});

 router.post('/list', auth, async(req, res) => {
 
			var empId = req.user.user_id;
			const employeeDetails = await Employee.findById(empId);
		 

			let nowDate = new Date();
			nowDate.setDate(nowDate.getDate() - 29);

			let date_2 = dateLib.format(nowDate,'YYYY-MM-DD');

			let date1 = new Date(employeeDetails.date.replace(/-/g, "/"));
			let date2 = new Date(date_2.replace(/-/g, "/"));
		
			let difference =  date1.getTime() - date2.getTime()

			let days = Math.ceil(difference / (1000 * 3600 * 24));

			let bestSTREAK = await StepTracker.aggregate([
               {$match: {employeeId: empId }},
			   { "$addFields": {"date1": {"$toDate": "$date"}} },
			   {
					"$addFields": {
					  "date": {
						"$toLong": "$date1"
					  }
					}
				  },
				  {
					$setWindowFields: {
					  partitionBy: "$employeeId",
					  sortBy: {
						date: 1
					  },
					  output: {
						days: {
						  $push: "$date",
						  window: {
							range: [
							  -86400000,
							  // one day in millisecond
							  0
							]
						  }
						}
					  }
					}
				  },
				  {
					"$set": {
					  "days": {
						"$cond": [
						  {
							"$gt": [
							  {
								"$size": "$days"
							  },
							  1
							]
						  },
						  0,
						  1
						]
					  }
					}
				  },
				  {
					$setWindowFields: {
					  partitionBy: "$employeeId",
					  sortBy: {
						date: 1
					  },
					  output: {
						count: {
						  $sum: "$days",
						  window: {
							documents: [
							  "unbounded",
							  "current"
							]
						  }
						}
					  }
					}
				  },
				  {
					"$group": {
					  "_id": {
						employeeId: "$employeeId",
						count: "$count",
						
					  },
					  "active_days": {
						$sum: 1
					  },
					  "to": {
						"$max": "$date"
					  },
					  "from": {
						"$min": "$date"
					  }
					}
				  },
				  {
					"$sort": {
					  to: -1
					}
				  },
				  {
					"$group": {
					  "_id": "$_id.employeeId",
					  "streak": {
						"$max": "$active_days"
					  }
					}
				  }
			
				]);

			if(bestSTREAK.length > 0){
				bestSTREAK = bestSTREAK.streak
			}else{
				bestSTREAK = 0
			}
			 

			let getDays = days < 0 ? 29 : 29 - days;
			var endDate = new Date(); 
		
			var startDate = new Date();
			startDate.setDate(startDate.getDate() - getDays);
			
			var emptStepTarget = {};
			var target = false;
		
			const stepTrackerList = await StepTracker.find({  employeeId: req.user.user_id,
					date: {
						$gte: dateLib.format(startDate,'YYYY-MM-DD'),
						$lte: dateLib.format(endDate,'YYYY-MM-DD')
					}
				}).sort({date:1})

			console.log('stepTrackerList', stepTrackerList)
				
			var stepTarget = await EmpStepTarget.findOne({ employeeId: req.user.user_id}).sort({date:-1});
		 

			if(stepTarget) {
				emptStepTarget['step_target'] = stepTarget.step_target;
				emptStepTarget['targetType'] = stepTarget.type;
				emptStepTarget['targetSteps'] = stepTarget.steps;
				emptStepTarget['duration'] = stepTarget.duration;
				target = true;
			}else{
				emptStepTarget['step_target'] = '0';
				emptStepTarget['targetType'] = "";
				emptStepTarget['targetSteps'] = "0";
				emptStepTarget['duration'] = "0";
			}
		
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
					 
					} else {
						 
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
			data.totalSteps = steps.toString();
			data.avgStep = isNaN(avg) ? 0 : avg.toString();
			data.todayData = stepTrackerDetailsToday
			data.step_target = emptStepTarget
			data.target = target
			data.activity = stepFinalArray.reverse()
			data.best_streak = Number(bestSTREAK)
			data.avg_pace = "100",
			data.targetType = emptStepTarget.targetType
	
			response = webResponse(201, true, data)  
			res.send(response);
			return;

 
})

router.post('/app_analytics', auth, async(req,res) => {
	var endDate = new Date(); 
	var startDate = new Date();
	startDate.setDate(startDate.getDate() - 29);
	var emptStepTarget = "0";
	var target = false;
	
	const stepTrackerList = await StepTracker.find({  employeeId: req.user.user_id,
			date: {
				$gte: dateLib.format(startDate,'YYYY-MM-DD'),
				$lte: dateLib.format(endDate,'YYYY-MM-DD')
			}
		}).sort({date:1})
		
    var stepTarget = await EmpStepTarget.findOne({ employeeId: req.user.user_id}).sort({date:-1});
	if(stepTarget) {
		emptStepTarget = stepTarget;
		target = true;
	}
	
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
		
		// var step = [];
		// var steps = 0;	
		// var noOfFound = 0;
		// for(i=startDate; i<=endDate;  i.setDate(i.getDate() + 1)) { 
		// 	var found = 0; 
		// 	for( var j = 0, len = stepTrackerList.length; j < len; j++ ) { 
		// 	   var stepTrackerData = '';
		// 	    if( stepTrackerList[j]['date'] == dateLib.format(i,'YYYY-MM-DD')) {
		// 			found = 1;
		// 			stepTrackerData = stepTrackerList[j];
		// 			break;
		// 		} 
		// 	}
		// 	if(found == 0) {
		// 		step = {
		// 			'date' : dateLib.format(i,'YYYY-MM-DD'),
		// 			'steps' : "0",
		// 			'km' : "0",
		// 			'calories':"0",
		// 			'duration':'00:00:00'
		// 		}
		// 		stepFinalArray.push(step);
		// 	}   else{
		// 		noOfFound = Number(noOfFound)+ 1
		// 		steps = Number(stepTrackerData.steps) + Number(steps)
		// 		stepFinalArray.push(stepTrackerData);
		// 	}
		// }
		
		var data = {}; 
		var avg = steps/noOfFound;
		data.totalSteps = steps.toString()
		data.avgStep = avg.toString()
		data.todayData = stepTrackerDetailsToday
		data.step_target = emptStepTarget
		data.target = target
		data.activity = stepFinalArray
		data.best_streak = "1000"
		data.avg_pace = "100"
		
		response = webResponse(201, true, data)  
		res.send(response);
		return;
})


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


router.post('/test', auth, async(req,res) => {

})

 module.exports = router