const fs = require('fs');
const AWS = require('aws-sdk');
 const express = require("express");
 const app = express.Router()
 var multer = require('multer')
var multerS3 = require('multer-s3-transform')
 require('../functions')
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
});
//app.use(express.limit('1M'));

var upload = multer({
   storage: multerS3({
       s3: s3,
       bucket:"soulcial/media",
	   acl: 'public-read',
       metadata: function (req, file, cb) {
           cb(null, { fieldName: file.fieldname });
       },
       key: function (req, file, cb) {
          //console.log(file.location);
            cb(null, Date.now().toString())
       },
	    contentType: multerS3.AUTO_CONTENT_TYPE
   }), limits: { fileSize: 1024 * 1024 * 50 } 
})

app.post('/upload', upload.single('picture'), function (req, res, next) { 
	var data = {'message':'File uploaded', 'url':req.file.location}
	response = webResponse(202, true, data)  
	res.send(response)
	return "";
}) 

 module.exports = app