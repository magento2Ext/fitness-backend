const express = require("express");
const mongoose = require('mongoose')
const app = express();
const cors = require("cors")
require("dotenv").config();
const port = process.env.PORT || 5000
const auth = require("./middleware/auth");
app.use(express.json())
const API_PORT = process.env.API_PORT


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

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
}); 

app.get('/', (req,res) => {
  res.send("welcome to the home page")
});

app.listen(port, () => {
    console.log('Server started'+port)
})