"use strict";

var mongoose = require("mongoose");
var paymentMethodSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    default_source: { type: String, required: true },
    cardHolderName: { type: String, required: true, lowercase: true },
    cardNumber: { type: Number, required: true, trim: true },
    exp_month: { type: String, required: true },
    exp_year: { type: String, required: true },
    customerId: { type: String, required: true },
    status: { type: String, default: false },
    cardType: { type: String, default: null },
  },
  { timestamps: true }
);


module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);