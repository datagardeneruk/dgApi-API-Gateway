var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../constants/constants');

var ObjectId = Schema.ObjectId;

var apiAccessSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    apiName: {
        type: String,
        required: true
    },
    hits: {
        type: Number,
        required: true
    },
    created: Date,
    lastHitsDate: Date

});

apiAccessSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date().toISOString();

    // change the updated_at field to current date
    this.lastHitsDate = currentDate;

    // if created_at doesn't exist, add to that field
    if (!this.created)
        this.created = currentDate;

    next();
});

var apiAccessDetailsModel = mongoose.model(
    constants.MONGO_API_ACCESS_DETAILS, apiAccessSchema, constants.MONGO_API_ACCESS_DETAILS
);

module.exports = apiAccessDetailsModel;