const auth = require("./../middleware/auth");
const Weight = require('./../models/weight')
const StepTracker = require('./../models/step_tracker')
const EmpStepTarget = require('./../models/employee_step_target')
const dateLib = require('date-and-time')
const Employee = require('./../models/employee')

const admin = require('firebase-admin');
var serviceAccount = require('./../admin.json');
 admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DB,
	authDomain: process.env.AUTH_DOMAIN,
 });

 const router = express.Router()

 module.exports = router
