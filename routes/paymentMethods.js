const express = require("express");
const router = express.Router()
const Employee = require('../models/employee');
const Organization = require('../models/organization')
const PaymentMethod = require('../models/paymentMethodModel')
 
const auth = require("../middleware/auth");
const dateLib = require('date-and-time');
var ObjectID = require('mongodb').ObjectID;

const errors = ['', '0', 0, null, undefined];

const path = require("path");

const stripe = require("stripe")(process.env.stripe_key);

router.get('/stripeconnect', async(req,res) => {
    console.log(req.query);
    try {
      var id = req.query.state;

      if (errors.indexOf(req.query.code) == -1) {
        
        stripe.oauth
          .token({
            grant_type: "authorization_code",
            code: req.query.code,
          })
          .then(function (response) {
            
            if (errors.indexOf(response.stripe_user_id)) {
              
                Organization.updateOne(
                { _id: id },
                { $set: { stripe_id: response.stripe_user_id } },
                { new: true },
                function (err, user) {
                  
                  if (user != null) {
                    res.sendFile(
                      path.join(__dirname, "../templates") +
                        "/stripeSuccess.html",
                      "utf8"
                    );
                  } else {
                    res.send({
                      status: 0,
                      msg: "Internal Server Error, Try again",
                    });
                  }
                }
              );
            }
          });
      }
  
      return;
    } catch (err) {
      console.log("Catch Error", err);
      return res
        .status(401)
        .send({ status: false, msg: "Something Went Wrong. Please Try Again!" });
    }
  });

  module.exports = router