var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');
var constants = require('../constants/constants');

var loginData = new Schema({
    user_control: String,
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        trim: true
    },
    referredData: {
        type: String,
    },
    refered_by: {
        type: String,
    },
    otherReferral: {
        type: String,
    },
    password: {
        type: String,
    },
    Pages: {
        type: Array
    },
    createdOn: Date,
    token: String,
    expiresAfter: Number,
    isEmailVerified: Boolean,
    phoneNumber: String,
    companyName: String,
    companyNumber: String,
    companyAddress: String,
    companyAddressObject: Object,
    city: String,
    postalCode: String,
    plan: String,
    hits: Number,
    totalHitsCons: Number,
    priceperhit: Number,
    api_access_token: Number,
    PagesArray: Array,
    IsAdmin: {
        type: Number,
        default: 0
    },
    limit: Number,
    location: Object,
    emailSubscription: {
        type: Boolean,
        default: true
    },
    public_access_token:{
        type: String,
        lowercase: true
    },
    public_limitCount:{
        type: Number,
        integer: true
    },
    companyReport: {
        type: Number
    },
    basicLimit: {
        type: Number
    },
    advancedLimit: {
        type: Number
    },
    landLimit: {
        type: Number
    },
    corpLandLimit: {
        type: Number
    },
    chargesLimit: {
        type: Number
    },
    creditReportLimit: {
        type: Number
    },
    allow_multiple_users: {
        type: Number,
        default: 0
    },
    payment_mode_offline: {
        type: Number,
        default: 0
    },
    no_of_multiple_users: {
        type: Number,
        default: 0
    },
    address_1: { type : String},
    address: { type : String},
    address_2: { type : String},
    country: {type : String},
    county: {type: String},
    lastLogin: Date,
    loggedIn: String,
    firstlogin: {
        type: Boolean,
        default: false
    },
    userStatus:{
        type: Boolean,
        default: true 
    },
    deletedStatus:{
        type: String
    }
});

//convert the password to hash before inserting into db
loginData.pre('save', function(next) {
    var user = this;
    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err)
            return next(err);
        user.password = hash;
        user.createdOn = new Date().toISOString();
        next();
    });
});

var loginModel = mongoose.model(constants.MONGO_DG_LOGIN, loginData, constants.MONGO_DG_LOGIN);
module.exports = loginModel;
