const auth = require("./../middleware/auth");
const Weight = require('./../models/weight')
const StepTracker = require('./../models/step_tracker')
const EmpStepTarget = require('./../models/employee_step_target')
const dateLib = require('date-and-time')
const Employee = require('./../models/employee')
const express = require("express");
const admin = require('firebase-admin');
var serviceAccount = require('./../admin.json');
const CronJob = require('cron').CronJob;
const { TimestreamQuery } = require("aws-sdk");
const errors = ['', '0', 0, null, undefined];
const sendFCM = require('./fcm');

let FCM = admin.messaging(); 
const router = express.Router()


 var job = new CronJob(
	"54 18 * * *",
	async () =>  {

        let employees = await Employee.find();

        employees.forEach( async (emp) => {

            if(errors.indexOf(emp.deviceToken) === -1){

                const recentWeight = await Weight.findOne({ employeeId: emp._id}).sort({date:-1});

                if(errors.indexOf(recentWeight.weight) === -1){
                    let BMI = await BMI_CAL(recentWeight.weight, emp.height);
                    sendFCM(emp.deviceToken, BMI.status, BMI.innerText, JSON.stringify(BMI));
                }

            }

        })
		
	},
	null,
	true
);



var job1 = new CronJob(
	"54 18 * * *",
	async () =>  {
        console.log('entering here');
        let employees = await Employee.find();
        console.log('entering here 1');
        employees.forEach( async (emp) => {
           
            if(errors.indexOf(emp.deviceToken) === -1){
                console.log('entering here 2');
                let today = new Date();
                const weightToday = await Weight.findOne({ employeeId: emp._id,
                    date: {
                        $eq: dateLib.format(today,'YYYY-MM-DD')
                    }
                });

                if(weightToday == null){
                    sendFCM(emp.deviceToken, 'Weight Reminder', "It seems like you forgot to add today's weight");
                }
            }

        })
		
	},
	null,
	true
);


var job2 = new CronJob(
	"45 18 * * *", async () =>  {

        let employees = await Employee.find();

        employees.forEach( async (emp) => {

            if(errors.indexOf(emp.deviceToken) === -1){
                let today = new Date();
                const weightToday = await Weight.findOne({ employeeId: emp._id,
                    date: {
                        $eq: dateLib.format(today,'YYYY-MM-DD')
                    }
                });

                if(weightToday == null){
                    sendFCM(emp.deviceToken, 'Weight Reminder', "It seems like you forgot to add today's weight");
                }
            }

        })
		
	},
	null,
	true
);

async function BMI_CAL(WEIGHT, HEIGHT){
    let result = {};
    let height = HEIGHT;
    let weight = WEIGHT * 0.45359237;
    let BMI  = (weight / ((height * height) / 10000)).toFixed(2);
    result.BMI = BMI;

    if(BMI < 18.5){
        result.status = 'underweight'
        result.innerText = "BMI indicates that you are underweight, so you may need to put on some weight. You are recommended to ask your doctor or a dietitian for advice";    
    }else if((BMI > 18.5) && (BMI < 24.9)){
        result.status = 'normal'
        result.innerText = "Your BMI falls within the normal or healthy weight range";
    }else if((BMI > 25) && (BMI < 29.9 )){
        result.status = 'overweight'
        result.innerText = "Your BMI falls within the overweight, so you may need to loose some weight. You are recommended to ask your doctor or a dietitian for advice";
    }else{
        result.status = 'obese'
        result.innerText = "Your BMI falls within the obese range, so you may need to loose weight. You are recommended to ask your doctor or a dietitian for advice";
    }

    return result;
}


router.post('/sendPush', async(req, res) => {

    let employees = await Employee.find();

    employees.forEach( async (emp) => {

        if(errors.indexOf(emp.deviceToken) === -1){

            const recentWeight = await Weight.findOne({ employeeId: emp._id}).sort({date:-1});

            if(errors.indexOf(recentWeight.weight) === -1){
                let BMI = await BMI_CAL(recentWeight.weight, emp.height);
                sendFCM(emp.deviceToken, BMI.status, BMI.innerText, JSON.stringify(BMI));
            }

        }

    })
    
})
 
 module.exports = router
