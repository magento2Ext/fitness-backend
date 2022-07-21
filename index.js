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
const dateLib = require('date-and-time')

const admin=require('firebase-admin');
var serviceAccount = require('./admin.json');
 admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DB,
	authDomain: process.env.AUTH_DOMAIN,
 });

 
const whitelist = [process.env.REACT_APP_URL]
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


app.post("/weight/save", auth, async(req, res) => { 
  try{ 
		const weight = new Weight({
			employeeId: req.user.user_id,
			weight: req.body.weight,
			date: req.body.date
		})
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
  try{ 
		var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

		var oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
		
		var oneMonthAgo = new Date();
		oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
		
		var date = new Date();
		
		const recentWeight = await Weight.findOne({ employeeId: req.user.user_id}).sort({date:-1});
		
		const weightLastDay = await Weight.findOne({ employeeId: req.user.user_id,
			date: {
				$lt: dateLib.format(date,'YYYY-MM-DD')
			}
		}).sort({date:-1});
		
		const weightLastWeek = await Weight.findOne({ employeeId: req.user.user_id,
			date: {
				$lt: dateLib.format(oneWeekAgo,'YYYY-MM-DD')
			}
		}).sort({date:-1});
		
		const weightLastMonth = await Weight.findOne({ employeeId: req.user.user_id,
			date: {
				$lte: dateLib.format(oneMonthAgo,'YYYY-MM-DD')
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
					'difference':0,
					'weightLine':''
					
				}
			} else{
				var difference = col.weight - weightList[i-1].weight;
				if(difference > 0) {
					var line = difference+" kilogram over weight."
				} else {
					var line = difference+" kilogram under weight."
				}
			    weight = {
					'date' :  dateLib.format(col.date,'YYYY-MM-DD'),
					'weight' : col.weight,
					'day' :  days[col.date.getDay()],
					'difference': difference,
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
					'difference':0,
					'weightLine':''
				}
				weightFinalArray.push(weight);
			}   else{
				weightFinalArray.push(weightData);
			}
		}
		
		
		
		var data = {}; 
		data.weight_diff = weightFinalArray
		data.lastOneWeekWeight = weightArray
		data.recentWeight = 0
		data.weightLastDay = 0
		data.weightLastWeek = 0
		data.weightLastMonth = 0
		
		if(recentWeight != null) {
			data.recentWeight = recentWeight.weight
		} 
		
		if(weightLastDay != null) {
			data.weightLastDay = weightLastDay.weight
		} 
		
		if(weightLastWeek != null) {
			data.weightLastWeek = weightLastWeek.weight
		} 
		
		if(weightLastMonth != null) {
			data.weightLastMonth = weightLastMonth.weight
		} 
		
		
		response = webResponse(202, true, data)  
		res.send(response);
		return;
	} catch(err){   
		response = webResponse(403, false, err)  
	    res.send(response)
		return;
    }
  
}); 

const otherApiRouter = require('./routes/otherapi')
app.use('/',otherApiRouter) 

app.get('/', (req,res) => {
  res.send("welcome to the home page")
});

app.listen(port, () => {
    console.log('Server started'+port)
})