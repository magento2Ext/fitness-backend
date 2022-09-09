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

let FCM = admin.messaging(); 
const router = express.Router()


 var job = new CronJob(
	"38 14 * * *",
	async () =>  {

        let employees = await Employee.find();

        employees.forEach( async (emp) => {

            if(errors.indexOf(emp.deviceToken) === -1){

                const recentWeight = await Weight.findOne({ employeeId: emp._id}).sort({date:-1});

                if(errors.indexOf(recentWeight.weight) === -1){
                    let BMI = await BMI_CAL(recentWeight.weight, emp.height);

                    console.log(BMI);

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



function sendFCM(token, title, body, data){
	const options = {
		priority: "high"
	  };
 

	const payload = {
		'notification': {
		  'title': title,
		  'body': body,
		}, 
		'data': data
	  };
    
      admin.messaging().sendToDevice(token, payload, options)
      .then( response => {
		console.log('response', response);
        return true
       
      })
      .catch( error => {
        console.log('error', error);
        return false
      });
}


 
 module.exports = router
