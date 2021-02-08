var mongoose = require('mongoose'),
    mongoosastic = require('mongoosastic'),
    Schema = mongoose.Schema;
var constants = require('../constants/constants');
var findInBatches = require('mongoose-batches');


var Company = new Schema({
    CompanyName: {
        type: String,
        es_indexed: true
    },
    CompanyNumber: {
        type: String,
        index: true,
        es_indexed: true
    },
    RegAddress: {
        CareOf: String,
        POBox: String,
        AddressLine1: String,
        AddressLine2: String,
        PostTown: String,
        County: String,
        Country: String,
        PostCode: String
    },
    pscData: [],
    active_directors: [],
    total_directors_count: Number,
    active_directors_count: Number,
    resigned_directors_count: Number,
    CompanyCategory: {
        type: String,
        es_indexed: true
    },
    IncorporationDate: {
        type: 'String',
        default: null
    },
    CompanyStatus: {
        type: String,
        es_indexed: true
    },
    CountryOfOrigin: String,
    DissolutionDate: {
        type: 'String',
        default: null
    },
    es_updated: {
        type: Number,
        index: true
    },
    es_set: Boolean,
    Accounts: {
        AccountRefDay: Number,
        AccountRefMonth: Number,
        NextDueDate: {
            type: 'String',
            default: null
        },
        LastMadeUpDate: {
            type: 'String',
            default: null
        },
        AccountCategory: String
    },
    Returns: {
        NextDueDate: {
            type: 'String',
            default: null
        },
        LastMadeUpDate: {
            type: 'String',
            default: null
        }
    },
    Mortgages: {
        NumMortCharges: Number,
        NumMortOutstanding: Number,
        NumMortPartSatisfied: Number,
        NumMortSatisfied: Number
    },
    SICCode: {
        SicText_1: String,
        SicText_2: String,
        SicText_3: String,
        SicText_4: String
    },
    LimitedPartnerships: {
        NumGenPartners: Number,
        NumLimPartners: Number
    },
    URI: String,
    PreviousName_1: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_2: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_3: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_4: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_5: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_6: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_7: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_8: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_9: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    PreviousName_10: {
        CONDATE: {
            type: 'String',
            default: null
        },
        CompanyName: String
    },
    ConfStmtNextDueDate: {
        type: 'String',
        default: null
    },
    ConfStmtLastMadeUpDate: {
        type: 'String',
        default: null
    },
    isStartUp: Boolean,
    location: Object,
    isAddressMapped: Boolean,
    shortPostCode: String,
    chargesExistandIndexed: Boolean,
    Industry: Object,
    RegAddress_Modified : Object
});

Company.plugin(mongoosastic, {
    
    hosts: constants.HOSTS,
    index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
})

Company.plugin(findInBatches);

var companyModel = mongoose.model(constants.MONGO_COMPANY_COLLECTION_NAME,
    Company,
    constants.MONGO_COMPANY_COLLECTION_NAME);
module.exports = companyModel;

/*page1.methods.paginate = (pgNo, callback)=>{

}*/
