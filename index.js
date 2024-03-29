const express = require("express");
const mongoose = require('mongoose')
const app = express();
const cors = require("cors")
require("dotenv").config();
const port = process.env.PORT || 5000
const auth = require("./middleware/auth");
app.use(express.json())
const API_PORT = process.env.API_PORT
const Weight = require('./models/weight')
const StepTracker = require('./models/step_tracker')
const EmpStepTarget = require('./models/employee_step_target')
const dateLib = require('date-and-time')
const Employee = require('./models/employee')
const admin = require('firebase-admin');
var serviceAccount = require('./admin.json');
const Organization = require('./models/organization')
const SubModule = require('./models/sub_module');
const Module = require('./models/module')
 admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DB,
	authDomain: process.env.AUTH_DOMAIN,
 });

const whitelist = [process.env.REACT_APP_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://soulcialapp.s3-website-us-east-1.amazonaws.com']
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
} 

app.use(cors(corsOptions)) 

const url = process.env.MONGO_URI;
mongoose.connect(url, {useNewUrlParser:true})
const con = mongoose.connection

con.on('open', () => {
    console.log('connected...')
}) 

 app.use(express.json())

const organizationRouter = require('./routes/organization')
app.use('/organization',organizationRouter)

const employeeRouter = require('./routes/employee')
app.use('/employee',employeeRouter)

const adminRouter = require('./routes/admin')
app.use('/admin',adminRouter)

const uploadRouter = require('./routes/upload')
app.use('/file', uploadRouter)

const videoRouter = require('./routes/motivationalVideo')
app.use('/mvideos',videoRouter)

const educationRouter = require('./routes/educationModule')
app.use('/education/module',educationRouter)

const stepTracker = require('./routes/stepTracker')
app.use('/steps',stepTracker)

const chatGroup = require('./routes/chatGroup')
app.use('/chat_group',chatGroup)

const chat = require('./routes/chat')
app.use('/chat',chat)

const teacherCategories = require('./routes/teacherCategories')
app.use('/categories',teacherCategories)

const teacher = require('./routes/teacher')
app.use('/teacher',teacher)

const weightTracker = require('./routes/weightTracker')
app.use('/weightTracker', weightTracker)

const challenge = require('./routes/challenge')
app.use('/challenge', challenge)

app.post("/testApi", async(req, res) => { 
	res.send({'status': 1})
})

const mind = require('./routes/mind')
app.use('/mind', mind)

const payment = require('./routes/paymentMethods')
app.use('/payment', payment)

app.post("/weight/save", auth, async(req, res) => { 
  try{ 
     	var empId = req.user.user_id;

		const weight = new Weight({
			employeeId: req.user.user_id,
			weight: req.body.weight,
			date: req.body.date
		})


		if(req.body.height){
	     	await Employee.updateOne({_id: empId}, {$set: {height: req.body.height, heightType: req.body.heightType}}, {new: true});
		}

		const weightDetails = await Weight.findOne({ date: req.body.date,  employeeId: req.user.user_id});
		
		if (weightDetails) {  
			weightDetails.weight =  req.body.weight
			const a1 = await weightDetails.save()
		} else{
			const a1 = await weight.save()
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

app.post("/weight/list", auth, async(req, res) => { 
  try{ 
		let type="day";
		if(req.body.type) {
			type="day";
		}
		const weight = await Weight.find({  employeeId: req.user.user_id})
		response = webResponse(201, true, weight)  
		res.send(response);
		return;
	} catch(err){   console.log(err)
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
  
}); 

app.post("/weight", auth, async(req, res) => { 
//   try{ 
        
		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId);
		const recentWeight = await Weight.findOne({ employeeId: empId}).sort({date:-1});

		async function noData(){
			let data = {}; 
			data.weight_diff = []
			data.lastOneWeekWeight = []
			data.recentWeight = 'Not added'
			data.weightLastDay = 'Not added'
			data.weightLastWeek = 'Not added'
			data.weightLastMonthArray = []
			data.weightLastMonth = 'Not added';
			data.BMI = {}
			return data;
		}

		if(recentWeight == null || recentWeight.weight == '0' || recentWeight.weight == null || recentWeight.weight == undefined){
			response = webResponse(202, true, await noData())  
			res.send(response);
			return;
		}

		async function BMI_CAL(WEIGHT){
                let result = {};
				let height = employeeDetails.height;
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

		let nowDate_1 = dateLib.format(nowDate,'MM/DD/YYYY');
 
	    let employeDate = employeeDetails.date.replace(/-/g, "/")

		let splitDate = employeDate.split('/');
		 
		let refactor = splitDate[1]+'/'+splitDate[2]+'/'+splitDate[0];

		let empJoiningDate = new Date(refactor);

		let nowDate_2 = new Date(nowDate_1.replace(/-/g, "/"));

		let difference =  empJoiningDate.getTime() - nowDate_2.getTime()

		let days_diff = Math.ceil(difference / (1000 * 3600 * 24));

		console.log('days_diff', days_diff, refactor, nowDate_1);
 
        // if(6 > days_diff){
		
			let getDays_monthly = days_diff == 0 ? 0 : (days_diff < 0 ? 29 : 29 - days_diff);
			let getDays_weekly =  days_diff == 0 ? 0 : (days_diff < 0 ? 6 : 6 - days_diff);

			console.log('getDays_monthly', getDays_monthly)

			var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		
			var oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
			
			var oneMonthAgo = new Date();
			oneMonthAgo.setDate(oneMonthAgo.getDate() - 29);
       
			var date = new Date();
			
			const weightLastDay = await Weight.findOne({ employeeId: empId,
				date: {
					$lt: dateLib.format(date,'YYYY-MM-DD')
				}
			}).sort({date:-1});

			const weightLastWeek = await Weight.findOne({ employeeId: empId,
				date: {
					$lt: dateLib.format(oneWeekAgo,'YYYY-MM-DD')
				}
			}).sort({date:-1});
			
			const weightLastMonth = await Weight.find({ employeeId: empId,
				date: {
					$gte: dateLib.format(oneMonthAgo,'YYYY-MM-DD')
				}
			}).sort({date:-1});


			const weightLastMonth_1 = await Weight.findOne({ employeeId: empId,
				date: {
					$eq: dateLib.format(oneMonthAgo,'YYYY-MM-DD')
				}
			}).sort({date:-1});

			async function lastWeekWeight(){

				let promise = new Promise( async (resolve, reject) => {

					const weightList = await Weight.find({  employeeId: empId,
						date: {
							$gte: dateLib.format(oneWeekAgo,'YYYY-MM-DD'),
							$lte: dateLib.format(date,'YYYY-MM-DD')
						}
					}).sort({date:1})

                    if(weightList.length == 0){
						 
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
									'weightLine':'',
									'BMI': BMI.status
								}
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
									'weightLine': line,
									'BMI': BMI.status
								}
							}
							
							weightArray.push(weight);
							i++;
							let count1 = 0;
							
							if(i === weightList.length){
							
								var weightFinalArray = [];
								for(i = oneWeekAgo; i <= date;  i.setDate(i.getDate() + 1)) { 
									
									var found = 0; 
							
									for( var j = 0, len = weightArray.length; j < len; j++ ) { 
										var weightData = '';
										if( weightArray[j]['day'] == days[i.getDay()]) {
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
											'weightLine':'',
											'BMI': null
					
										}
										weightFinalArray.push(weight);
									}   else{
										weightFinalArray.push(weightData);
									}
								
							
									count1++;
								 
									if(String(date) == String(i)){
										resolve(weightFinalArray)
								   }

								}

							}
						});

					}
					
				})

				return promise;
			}
	
	
			var data = {}; 
			let weeklyResult = await lastWeekWeight();
		 
			data.weight_diff = weeklyResult.reverse();

			data.weightLastMonth = 'Not added';
			if(weightLastMonth_1 != null) {
				data.weightLastMonth = weightLastMonth_1.weight
			} 
			// data.lastOneWeekWeight = weightArray
			data.weightLastMonthArray = weightLastMonth;
			data.BMI = await BMI_CAL(recentWeight.weight);
			
			data.recentWeight = recentWeight.weight
			
			data.weightLastDay = weightLastDay != null ? weightLastDay.weight : 'Not added'

			data.weightLastWeek = weightLastWeek !=null ? weightLastWeek.weight : 'Not added'

			response = webResponse(202, true, data)  
			res.send(response);
			return;
   
}

); 


app.post("/analytics", auth, async(req, res) => { 
	try{ 

		var empId = req.user.user_id;
		const employeeDetails = await Employee.findById(empId);
		let subModules = [];
		let moduless = [];

		if(employeeDetails.userOrganizations.length !== 0){

			const org = await Organization.findById(employeeDetails.organizationId)
		
			var subModuleIds = org.subModule_id
			var subIds = []
			if(subModuleIds != "") {
				subIds = subModuleIds.split(",")
			}  

			const subModuless = await SubModule.find({'_id': {'$in': subIds}})

			subModuless.forEach( (module) => {
	 
				subModules.push(module.name.toLowerCase())
			})


			var modules = org.modules; 
			var ids = modules.split(",")
			var ModuleList = await Module.find({ _id : { $in : ids } })
   
			ModuleList.forEach( (module) => {
				moduless.push(module.name.toLowerCase())
			})
   
		}

		  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		  
		  var oneWeekAgo = new Date();
		  oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
		  
		  var oneMonthAgo = new Date();
		  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  
		  var date = new Date();
 
		  const weightLastMonth = await Weight.find({ employeeId: req.user.user_id,
			  date: {
				  $gte: dateLib.format(oneMonthAgo,'YYYY-MM-DD')
			  }
		  }).sort({date:-1});
  
		  const weightList = await Weight.find({  employeeId: req.user.user_id,
			  date: {
				  $gte: dateLib.format(oneWeekAgo,'YYYY-MM-DD'),
				  $lte: dateLib.format(date,'YYYY-MM-DD')
			  }
		  }).sort({date:1})
 
		  var weightArray = [];		
		  var i=0;
		  weightList.forEach(function(col) {
			  // Do something with each collection.				  
			  if(i == 0) {
				  weight = {
					  'date' : dateLib.format(col.date,'YYYY-MM-DD'),
					  'weight' : col.weight,
					  'day' :  days[col.date.getDay()],
					  'difference': "0",
					  'weightLine':''
				  }
			  } else{
				  var difference = col.weight - weightList[i-1].weight;
				  if(difference > 0) {
					  var line = convertIntoTwoDecimal(difference)+" kilogram over weight."
				  } else {
					  var line = convertIntoTwoDecimal(difference)+" kilogram under weight."
				  }
				  weight = {
					  'date' :  dateLib.format(col.date,'YYYY-MM-DD'),
					  'weight' : col.weight,
					  'day' :  days[col.date.getDay()],
					  'difference': convertIntoTwoDecimal(difference),
					  'weightLine':line,
				  }
			  }
			  weightArray.push(weight);
			  i++;		
		  });
		  var weightFinalArray = [];
			  
		  for(i=oneWeekAgo; i<=date;  i.setDate(i.getDate() + 1)) { 
			  var found = 0; 
			  for( var j = 0, len = weightArray.length; j < len; j++ ) { 
				  var weightData = '';
				  if( weightArray[j]['day'] == days[i.getDay()]) {
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
				  weightFinalArray.push(weight);
			  }   else{
				  weightFinalArray.push(weightData);
			  }
		  }
		  let weightFinalArray1 = [];
		  getMonthly();
  		 
		  function getMonthly(){

			var weightArray1 = [];		
			var i = 0;
		
			weightLastMonth.forEach(col =>  {
			 
				if(i == 0) {
					weight = {
						'date' : dateLib.format(col.date,'YYYY-MM-DD'),
						'weight' : col.weight,
						'day' :  days[col.date.getDay()],
						'difference': "0",
						'weightLine':''
					}
					
				} else{
					var difference = col.weight - weightLastMonth[i-1].weight;
					if(difference > 0) {
						var line = difference+" kilogram over weight."
					} else {
						var line = difference+" kilogram under weight."
					}
					weight = {
						'date': dateLib.format(col.date,'YYYY-MM-DD'),
						'weight': col.weight,
						'day': days[col.date.getDay()],
						'difference': difference,
						'weightLine': line,
					}
				}
				weightArray1.push(weight);
				i++;		
			});

		
			let latestWeight = 0;
			for(i=oneMonthAgo; i<=date;  i.setDate(i.getDate() + 1)) { 

				var found = 0; 
				
				for( var j = 0, len = weightArray1.length; j < len; j++ ) { 
					var weightData = '';
				    let spliDate = String(dateLib.format(i,'YYYY-MM-DD')).split('T')[0];
				 
					if( weightArray1[j]['date'] == spliDate) {
						found = 1;
						weightData = weightArray1[j];
						latestWeight = weightData.weight;
						break;
					} 
				}

				if(found == 0) {
					weight = {
						'date' : dateLib.format(i,'YYYY-MM-DD'),
						'weight' : latestWeight,
						'day' : days[i.getDay()],
						'difference': "0",
						'weightLine':''
					}
					weightFinalArray1.push(weight);
				}   else{
					weightFinalArray1.push(weightData);
				}
			}

		  }

		  let stepFinalArrayWeekly = [];
		  var stepFinalArrayMonthly = [];
		  steps();

		  async function  steps(){
			var endDate = new Date(); 
	
			var startDate = new Date();
			startDate.setDate(startDate.getDate() - 29);

			var startWeeklyDate = new Date();
			startWeeklyDate.setDate(startWeeklyDate.getDate() - 6);
			
			var emptStepTarget = "0";
			var target = false;
			
			const stepTrackerList = await StepTracker.find({  employeeId: req.user.user_id,
					date: {
						$gte: dateLib.format(startDate,'YYYY-MM-DD'),
						$lte: dateLib.format(endDate,'YYYY-MM-DD')
					}
				}).sort({date:1})

			const stepTrackerListWeekly = await StepTracker.find({  employeeId: req.user.user_id,
				date: {
					$gte: dateLib.format(startWeeklyDate,'YYYY-MM-DD')
				}
			}).sort({date:1})

			console.log({  employeeId: req.user.user_id,
				date: {
					$lte: dateLib.format(startDate,'YYYY-MM-DD'),
					$gte: dateLib.format(startWeeklyDate,'YYYY-MM-DD')
				}
			})
				
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
						 
					} else {
						 
					}
				}
			);
			
				var steps = 0;	
				var noOfFound = 0;
				for(i=startDate; i<=endDate;  i.setDate(i.getDate() + 1)) { 
					var found = 0; 
					for( var j = 0, len = stepTrackerList.length; j < len; j++ ) { 
					   var stepTrackerData = '';
						if( stepTrackerList[j]['date'] == dateLib.format(i,'YYYY-MM-DD')) {
							found = 1;
							stepTrackerData = 
							{
								'date' : stepTrackerList[j].date,
								'day': days[i.getDay()],
								'steps' : stepTrackerList[j].steps,
								'km' : stepTrackerList[j].km,
								'calories': stepTrackerList[j].calories,
								'duration': stepTrackerList[j].duration,
							}
						 
							break;
						} 
					}
					
					if(found == 0) {
						step = {
							'date' : dateLib.format(i,'YYYY-MM-DD'),
							'day': days[i.getDay()],
							'steps' : "0",
							'km' : "0",
							'calories':"0",
							'duration':'00:00:00'
						}
						stepFinalArrayMonthly.push(step);
					}   else{
						noOfFound = Number(noOfFound)+ 1
						steps = Number(stepTrackerData.steps) + Number(steps)
						stepFinalArrayMonthly.push(stepTrackerData);
					}
				}

				
				getMonthlySteps();

				function getMonthlySteps(){

					console.log('stepTrackerListWeekly', stepTrackerListWeekly)
					
					var steps = 0;	
					var noOfFound = 0;
					for(i=startWeeklyDate; i<=endDate;  i.setDate(i.getDate() + 1)) { 
						var found = 0; 
						for( var j = 0, len = stepTrackerListWeekly.length; j < len; j++ ) { 
						   var stepTrackerData = '';
							if( stepTrackerListWeekly[j]['date'] == dateLib.format(i,'YYYY-MM-DD')) {
								found = 1;
								stepTrackerData  = {
									'date' : stepTrackerListWeekly[j].date,
									'day': days[i.getDay()],
									'steps' : stepTrackerListWeekly[j].steps,
									'km' : stepTrackerListWeekly[j].km,
									'calories': stepTrackerListWeekly[j].calories,
									'duration': stepTrackerListWeekly[j].duration,
								}
								break;
							} 
						}
						if(found == 0) {
							step = {
								'date' : dateLib.format(i,'YYYY-MM-DD'),
								'day': days[i.getDay()],
								'steps' : "0",
								'km' : "0",
								'calories':"0",
								'duration':'00:00:00'
							}
							stepFinalArrayWeekly.push(step);
						}   else{
							noOfFound = Number(noOfFound)+ 1
							steps = Number(stepTrackerData.steps) + Number(steps)
							stepFinalArrayWeekly.push(stepTrackerData);
						}
					}
				}
				
		  }

		  setTimeout(() => {
			var data = {}; 
			data.weightWeekly = weightFinalArray
			data.weightMonthly = weightFinalArray1
			data.stepsMonthly = stepFinalArrayMonthly
			data.stepsWeekly = stepFinalArrayWeekly

			if(employeeDetails.userOrganizations.length === 0){
				data.isWeight = true
				data.isSteps = true
			}
			else if(moduless.indexOf('body') >= 0 ){
				data.isWeight = subModules.indexOf('weight tracker') >= 0 ? true: false
				data.isSteps = subModules.indexOf('step tracker') >= 0 ? true: false

			}else{
				data.isWeight = false
				data.isSteps = false
			}

			response = webResponse(202, true, data)  
			res.send(response);
			return;
		  }, 3000);
	  } catch(err){ 
		  console.log(err)  
		  response = webResponse(403, false, err)  
		  res.send(response)
		  return;
	  }
	
  }
  
  ); 


function convertIntoTwoDecimal(num){
	let toNumber = Number(num);
	let n;
	if(toNumber % 1 !== 0) n = toNumber.toFixed(2);
	else n = toNumber;
	return n;
}

const otherApiRouter = require('./routes/otherapi');
const { LEGAL_TCP_SOCKET_OPTIONS } = require("mongodb");
app.use('/',otherApiRouter) 

app.get('/', (req,res) => {
  res.send("welcome to the home page")
});

app.listen(port, () => {
    console.log('Server started'+port)
})

