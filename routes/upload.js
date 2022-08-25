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
       bucket:"soulcialapp/media",
	   acl: 'public-read',
       metadata: function (req, file, cb) {
           cb(null, { fieldName: file.fieldname });
       },
       key: function (req, file, cb) {

        const filename = `${Date.now()}_${sanitize(
            file.originalname.replace(
              /[`~!@#$%^&*()_|+\-=÷¿?;:'",<>{}[]\\\/]/gi,
              '',
            ),
          )}`;
      
          var newFileName = Date.now() + "-" + filename;
          cb(null, newFileName);

          //console.log(file.location);
            // cb(null, Date.now().toString())
       },
	    contentType: multerS3.AUTO_CONTENT_TYPE
   }), limits: { fileSize: 52428800 } 
})

app.post('/upload', upload.single('picture'), function (req, res, next) { 
	var data = {'message':'File uploaded', 'url': req.file.location}
	response = webResponse(202, true, data)  
	res.send(response)
	return "";
}) 

 module.exports = app


 multerS3({
    s3: s3,
    bucket: process.env.AWS_PROFILE_IMAGE_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (request, file, ab_callback) {
      ab_callback(null, {fieldname: file.fieldname});
    },
    key: function (request, file, ab_callback) {
  
      // add hash to sanitized file name
      const filename = `${Date.now()}_${sanitize(
        file.originalname.replace(
          /[`~!@#$%^&*()_|+\-=÷¿?;:'",<>{}[]\\\/]/gi,
          '',
        ),
      )}`;
  
      var newFileName = Date.now() + "-" + filename;
      var fullPath = 'users/profile/' + newFileName;
      ab_callback(null, fullPath);
    },
  })