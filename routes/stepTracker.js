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

		console.log(req.body);

	 
		var stepTarget = await EmpStepTarget.findOne({ employeeId: req.user.user_id}).sort({date:-1});

		let stepTargetSteps = (stepTarget.steps + req.body.steps) <= stepTarget.step_target ?  (stepTarget.steps + req.body.steps) : stepTarget.step_target;
		let targetDuration = await hhmmss(stepTarget.duration, 'seconds') + await  hhmmss(req.body.duration, 'seconds');

		

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
			let newDuration = await hhmmss(stepTrackerDetails.duration, 'seconds') + await hhmmss(req.body.duration, 'seconds');
			console.log('newDuration', newDuration)
			console.log('await hhmmss(newDuration,)', await hhmmss(newDuration, 'hms'))
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
			console.log(employeeDetails)

			let nowDate = new Date();
			nowDate.setDate(nowDate.getDate() - 29);

			let date_2 = dateLib.format(nowDate,'YYYY-MM-DD');

			let date1 = new Date(employeeDetails.date.replace(/-/g, "/"));
			let date2 = new Date(date_2.replace(/-/g, "/"));
		
			let difference =  date1.getTime() - date2.getTime()

			let days = Math.ceil(difference / (1000 * 3600 * 24));

			// let userTotalDistance = await StepTracker.aggregate([
			// 	{ $group: {
			// 		_id: '$employeeId',
			// 		stepAvg: { $avg: '$km'}
			// 	}}
			// ]);

			// let userTotalSteps = await StepTracker.aggregate([
			// 	{ $group: {
			// 		_id: '$employeeId',
			// 		stepAvg: { $avg: '$steps'}
			// 	}}
			// ]);
	

	if(29 > days){
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
		 
		   let bestStreakK = await bestStreak();
	
			async function bestStreak(){
				
				const promise = new Promise( async (resolve, reject) => {
	
					let allSteps = 	await StepTracker.find({  employeeId: req.user.user_id}).sort({date:1});
			 
					if(allSteps.length < 2) {
						if(allSteps.length == 1) resolve(allSteps[0].steps);
						else resolve(0);
					}
					else{
	
						let count = 1;
						let streaks = [];
						let oneCount = Number(allSteps[0].steps);
		  
						allSteps.forEach( (key) => {
	
		
							console.log('allSteps[count]', allSteps[count])
							
							if(allSteps[count] != null && allSteps[count] != undefined){
	
								let date1 = new Date(allSteps[count].date.replace(/-/g, "/"));
								let date2 = new Date(key.date.replace(/-/g, "/"));
					
								let difference =  date1.getTime() - date2.getTime()
					
								let days = Math.ceil(difference / (1000 * 3600 * 24));
							
								if(days > 1) {
									streaks.push(oneCount);
									oneCount = Number(key.steps);
								}
				
								if(days == 1) oneCount = Number(oneCount) + Number(allSteps[count].steps);
				
								count++;
				
								if(days > 1 && count === allSteps.length) {
									if(count === allSteps.length) streaks.push(oneCount);
								}
				 
								if(count === allSteps.length){
									if(days == 1) streaks.push(oneCount);
	 
									 let max = Math.max(...streaks);
									resolve(max)
								}
								
							}
				
						})
	
					}
	
				});
	
				return promise;
			}

			var data = {}; 
			var avg = steps/noOfFound;
			data.totalSteps = steps.toString();
			data.avgStep = isNaN(avg) ? 0 : avg.toString();
			data.todayData = stepTrackerDetailsToday
			data.step_target = emptStepTarget
			data.target = target
			data.activity = stepFinalArray.reverse()
			data.best_streak = Number(bestStreakK)
			data.avg_pace = "100",
			data.targetType = emptStepTarget.targetType
	
			response = webResponse(201, true, data)  
			res.send(response);
			return;

	}else{
		var data = {}; 
		let nowDate = new Date();
		data.totalSteps = "0";
		data.avgStep = 0;
		data.todayData = {
			'date' : dateLib.format(nowDate,'YYYY-MM-DD'),
			'steps' : "0",
			'km' : "0",
			'calories':"0",
			'duration':'00:00:00'
		}
		data.step_target = {step_target: "0"}
		data.target = false
		data.activity = []
		data.best_streak = 0
		data.avg_pace = 0
		data.targetType = ""
		
		response = webResponse(201, true, data)  
		res.send(response);
		return;
	}
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

	const promise = new Promise( (resolve, reject) => {
		if(type === 'hms'){
			const time = new Date( Number(val) * 1000).toISOString().substring(11, 16);
		    resolve(time)
		}else{
			if(val == '0'){
				resolve(0)
			}else{
				var a = val.split(':');  
				var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
			}

			
		}
	})

return promise
}

 

 module.exports = router