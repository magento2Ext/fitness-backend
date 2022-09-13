 
const express = require("express");
const admin = require('firebase-admin');
const errors = ['', '0', 0, null, undefined];
let FCM = admin.messaging(); 

const sendFCM = (token, title, body, data) => {

	const options = {
		priority: "high"
	  };
 
	const payload = {
		'notification': {
		  'title': title,
		  'body': body,
          'image': "https://i.imgur.com/CzXTtJV.jpg",
		}, 
		'data': {'data': data}
	  };
    
      admin.messaging().sendToDevice(token, payload, options).then( response => {
		console.log('response', response);
        return true
      })
      .catch( error => {
        console.log('error', error);
        return false
      });
}

module.exports = sendFCM