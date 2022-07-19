const nodemailer = require('nodemailer');


webResponse = function( statusCode, status, reply, extra=[]){ 
	const response = [];
	message = ''
	errors = []
	result = []
	result_obj = []
	extra = extra
	

    if (statusCode == 201) {
        result = reply;
    } else if(statusCode == 202){
		result_obj = reply
	} else if (statusCode == 403 ) {
		jsonObj = [];
		reply = reply.errors
		
		for (var key in reply) {
			var item = {
				'key' : key,
				'value' : reply[key]['kind'] 
			}
			jsonObj.push(item);
		}
		
        errors = jsonObj;
    }else if (statusCode == 406 ) {
		errors = reply;
		statusCode = 403
    } else {
        message = reply;
    }
    return {success:status, status:statusCode, message:message, errors: errors, result:result, result_obj:result_obj, extra:extra};
}; 

sendEmail = function( emailId, subject, emailContent) { 
    var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'njarewal82@gmail.com',
			pass: 'tnhxwdaiirfoblfl'
		}
	});
	
	var mailOptions = {
		from: 'technodeviser05@gmail.com',
		to: emailId,
		subject: subject,
		text: emailContent
	};
	
	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
};

timeAgo = function(date1) {
	var date = new Date(date1);
	var seconds = Math.floor((new Date() - date) / 1000);

  var interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes";
  }
  return Math.floor(seconds) + " seconds";
};