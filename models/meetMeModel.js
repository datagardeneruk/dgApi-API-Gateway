var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var constants = require('../constants/constants');

var ObjectId = Schema.ObjectId;

var meetMeModelSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    destinationCompanyName: {
        type : String
    },
    destinationCompanyNumber: {
        type : String,
        required : true
    },
    destinationDirectorName: {
        type : String
    },
    destinationDirectorPnr: {
        type : Number
    },
    option: {
        type : String,
        required : true
    },
    sourceCompanyName: {
        type : String
    },
    sourceCompanyNumber: {
        type : String,
        required : true
    },
    sourceDirectorName: {
        type : String
    },
    sourceDirectorPnr: {
        type : Number
    },
    relation: {
        type: Object
    },
    created: Date
});

meetMeModelSchema.pre('save', function(next) {
    // get the current date
    var currentDate = new Date().toISOString();

    // if created_at doesn't exist, add to that field
    if (!this.created)
        this.created = currentDate;

    next();
});

var meetMeModel = mongoose.model(
    constants.MONGO_MEET_ME_MASTER, meetMeModelSchema, constants.MONGO_MEET_ME_MASTER
);

module.exports = meetMeModel;