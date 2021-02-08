var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../constants/constants');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var subscription = new Schema({
    planID: {
        required: true,
        type: ObjectId
    },
    userID: {
        required: true,
        type: ObjectId
    },
    paymentID: {
        required: false,
        type: ObjectId
    },
    invoice: {
        required: false,
        type: String
    },
    invoice_no: {
        type: String,
        unique: false
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    features: {
        type: Array,
        required: true
    },
    description: String,
    cost: {
        type: Number,
        required: true
    },
    vat: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        default: 30
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: Number,
        default: 0
    },
    Recurring: {
        type: Number,
        default: 1
    },
    subscription_status: {
        type: Number,
        default: 0
    },
    coupon_code:{
      type: String
    },
    SubscriptionStripeId: String,
    stripePlanId: String,
    createdOn: Date,
    createdBy: {
        type: ObjectId
    },
    amountPaid:{
        type: Number
    },
    appliedCoupon:{
        type: String
    },
    discountAmount:{
        type: Number
    },
    updatedOn: Date,
    updatedBy: {
        type: ObjectId
    }
});

// on every save, add the date
subscription.pre('save', function(next) {
    // get the current date
    var currentDate = new Date();

    // change the updated_at field to current date
    this.updatedOn = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.createdOn)
        this.createdOn = currentDate;

    next();
});

var subscriptionModel = mongoose.model(
    constants.MONGO_DG_SUBSCRIPTION, subscription, constants.MONGO_DG_SUBSCRIPTION
);

module.exports = subscriptionModel;
