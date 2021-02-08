var express = require('express');
var app = express.Router();
var esUtilitiesSearch = require("../utilities/elasticSearchScripts/constructElasticQuery");
var Company = require("../models/companyModel");

const bcrypt = require("bcryptjs"),
    crypto = require("crypto"),
    // async = require("async"),
    ObjectID = require("mongodb").ObjectID,
    request = require("request");

const apiKeys = require("../constants/api_keys"),
    keys = apiKeys.API_KEYS,
    constants = require("../constants/constants");

/** Models */
const loginModel = require("../models/loginModel"),
    userSubscriptionModel = require('../models/userSubscriptionModel'),
    apiAccessDetailsModel = require('../models/apiAccessDetailsModel'),
    meetMeModel = require("../models/meetMeModel");

var connections = require('../constants/mongo_connection');
// const MONGO_DB_CONNECTION_URL = 'mongodb://dgadminreadWrite:Dg-Tt-Wh-2020@mongo-primary-node:52498,mongo-secondary-node-one:52498,mongo-secondary-node-two:52498/dgsafe?replicaSet=mongo-cluster';
const MONGO_DB_CONNECTION_URL = 'mongodb://dgadminreadWrite:Dg-Tt-Wh-2020@test.datagardener.com:52498/dgsafe';
const dgsafeConnection = connections.dgsafeConnection(MONGO_DB_CONNECTION_URL);

var countryMap = new Map();

const es = require("elasticsearch"),
    client = new es.Client({ hosts: constants.HOSTS }),
    esUtilities = { default_page_size: 1000 };

var client1 = new es.Client({
    hosts: constants.HOSTS
});

app.post("/authenticate", async (req, res) => {
    // console.log(req)
    let email = req.body.email.toLowerCase();
    let password = req.body.password;
    // console.log(email, "HERE ... Email")
    loginModel.findOne({email: email}).exec(function (err, user) {
        if (err) {
            return res.json({
                status: 401,
                msg: "Something went wrong."
            })
        }

        if (email !== '') {
            // console.log(user, "HERE... user")
            if (user === null) {
                return res.json({
                    status: 401,
                    msg: "User does not exist."
                })
            }
        }

        if (user === null) {
            return res.json({
                status: 401,
                msg: "Please enter your valid email."
            })
        }

        if (!user) return res.status(400).json("No user found.");

        if (user._id !== undefined) {
            userSubscriptionModel.find({
                "userID": user._id
            }, (error, results) => {
                if (error) {
                    return res.json({
                        status: 401,
                        msg: "Please try again"
                    })
                }
                if (results.length === 0) {
                    return res.json({
                        status: 401,
                        msg: "You are not subscribed to any plan. Please contact Administrator"
                    })
                }
                else {
                    if (user.isEmailVerified == false && user.deletedStatus != 'deleted') {
                        var userData = {};
                        userData.email = email;
                        var token = crypto.randomBytes(20).toString("hex");
                        var expiresAfter = Date.now() + 86400000;
                        userData.token = token;
                        userData.expiresAfter = expiresAfter;

                        return res.json({
                            status: 401,
                            msg: "Your email id is not verified. Please verify your email first."
                        })
                    } else if (user.userStatus == false || user.deletedStatus === 'deleted') {
                        return res.json({
                            status: 401,
                            msg: "Your account has been deactivated. Please contact Admin i.e grow@datagardener.com"
                        })
                    } else {
                        var allFeaturesOfUser = [];
                        bcrypt.compare(password, user.password, async function (err, resultCompare) {
                            if (resultCompare == true) {
                                if (user.api_access_token !== undefined && user.api_access_token !== null && user.api_access_token !== "") {
                                    return res.status(200).json({ token: user._id + '_' + user.api_access_token });
                                }
                            } else {
                                return res.json({
                                    status: 401,
                                    msg: "Wrong username or password"
                                })
                            }
                        })
                    }
                }
            })
        }
    });
});

app.get("/getDocumentListByCompany/:companyNumber", async (req, res) => {
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        let companyNumber = req.params.companyNumber;
                        let randkey = keys[Math.floor(Math.random() * keys.length)];
                        let a = new Buffer.from(randkey).toString('base64');
                        let headers = { 'content-type': 'application/json', 'Authorization': 'Basic ' + a };
                        var options = {
                            url: "https://api.companieshouse.gov.uk/company/" + companyNumber.toUpperCase() + "/filing-history?items_per_page=100",
                            headers: headers
                        };
                        try {
                            await request(options, async function (error, response) {
                                if (error) {
                                    console.log('Error In Fetching Documents: ', error);
                                    return res.json({
                                        status: 404
                                    });
                                }
                                else {
                                    if (typeof JSON.parse(response['body']) == 'object') {
                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getDocumentListByCompany",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getDocumentListByCompany",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: JSON.parse(response['body']),
                                                                    })
                                                                }
                                                            })
                                                        } if (data.length == 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getDocumentListByCompany",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: JSON.parse(response['body']),
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }
                                                })
    
                                            }
                                        })
                                    } else {
                                        return res.json({
                                            status: 404
                                        });
                                    }
                                }
                            })
                        } catch (error) {
                            res.json({
                                err:error
                            })
                        }
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getFilingHistoryByCompany/:companyNumber", async (req, res) => {
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        let companyNumber = req.params.companyNumber;
                        let randkey = keys[Math.floor(Math.random() * keys.length)];
                        let a = new Buffer.from(randkey).toString('base64');
                        let headers = { 'content-type': 'application/json', 'Authorization': 'Basic ' + a };
                        var options = {
                            url: "https://api.companieshouse.gov.uk/company/" + companyNumber.toUpperCase() + "/filing-history",
                            headers: headers
                        };
                        await request(options, async function (error, response) {
                            if (error) {
                                console.log('Error In Fetching Documents: ', error);
                                return res.json({
                                    status: 404
                                });
                            }
                            else {
                                if (typeof JSON.parse(response['body']) == 'object') {
                                    loginModel.findOneAndUpdate({
                                        _id: new ObjectID(user_id)
                                    }, {
                                        $set: {
                                            hits: hits - 1,
                                            totalHitsCons: totalHitsCons + 1
                                        }
                                    }, (error, docs) => {
                                        if (error) {
                                            console.log("Error Was occured Updating Limit ")
                                            return res.status(400).json({ status: 400, message: "Error was Occured" })
                                        } if (docs) {
                                            apiAccessDetailsModel.find({
                                                userId: new ObjectID(user_id),
                                                apiName: "getFilingHistoryByCompany",
                                            }, (error, data) => {
                                                if (error) {
                                                    console.log("Error was Occured", error)
                                                } if (data) {
                                                    if (data.length > 0) {
                                                        let hits = data[0]["hits"];
                                                        let currentdate = new Date().toISOString();
                                                        apiAccessDetailsModel.findOneAndUpdate({
                                                            userId: new ObjectID(user_id),
                                                            apiName: "getFilingHistoryByCompany",
                                                        }, {
                                                            $set: {
                                                                hits: hits + 1,
                                                                lastHitsDate: currentdate
                                                            }
                                                        }, (error, docs) => {
                                                            if (error) {
                                                                console.log("Error Was Occured");
                                                                return res.status(400).json({
                                                                    status: 400,
                                                                    message: "Message "
                                                                })
                                                            } if (docs) {
                                                                return res.status(200).json({
                                                                    status: 200,
                                                                    message: 'Success',
                                                                    results: JSON.parse(response['body']),
                                                                })
                                                            }
                                                        })
                                                    } if (data.length == 0) {
                                                        apiAccessDetailsModel.create({
                                                            userId: new ObjectID(user_id),
                                                            apiName: "getFilingHistoryByCompany",
                                                            hits: 1
                                                        }, (error, docs) => {
                                                            if (error) {
                                                                console.log(error);
                                                                return res.status(400).json({
                                                                    status: 400,
                                                                    message: "Message "
                                                                });
                                                            } if (docs) {
                                                                return res.status(200).json({
                                                                    status: 200,
                                                                    message: 'Success',
                                                                    results: JSON.parse(response['body']),
                                                                })
                                                            }
                                                        })
                                                    }
                                                }
                                            })

                                        }
                                    })
                                } else {
                                    return res.json({
                                        status: 404
                                    });
                                }
                            }
                        })
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getComprehensiveDetailsByCompany/:companyNumber", async (req, res) => {
    let companyNumber = req.params.companyNumber.toString().toLowerCase();
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        await client.search({
                            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                            body: {
                                // _source: {
                                //     excludes:["safeNum"]
                                // },
                                query: {
                                    term: {
                                        companyRegistrationNumber: companyNumber
                                    }
                                }
                            }
                        }, async (error, response) => {
                            if (error) {
                                console.log("Error: ", error);
                                return res.json({
                                    status: 404
                                });
                            } else {
                                if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {
                                    if (response["hits"]["hits"][0]["_source"].hasContactInfo !== undefined) {
                                        if (response["hits"]["hits"][0]["_source"].hasContactInfo == true) {
                                            let contactInfoData = await contactInfoDataRelatedCompany(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                            console.log(contactInfoData)
                                            if (contactInfoData != 0) {
                                                response["hits"]["hits"][0]["_source"]['contactInfo'] = contactInfoData;
                                            }
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasLandCorporate !== undefined) {
                                        if (response["hits"]["hits"][0]["_source"].hasLandCorporate == true) {
                                            let landCorporateInfoData = await landCorporateInfoDataRelatedCompany(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                            if (landCorporateInfoData != 0) {
                                                response["hits"]["hits"][0]["_source"]['landCorporateInfo'] = landCorporateInfoData;
                                            }
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasCCJInfo !== undefined) {
                                        let ccjDetails = await getCCJDetails(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        if (ccjDetails != 0) {
                                            response["hits"]["hits"][0]["_source"]['ccjDetails'] = ccjDetails;
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasShareHolders !== undefined) {
                                        let shareDetails = await getShareDetails(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        if (shareDetails.length > 0) {
                                            response["hits"]["hits"][0]["_source"]['shareDetails'] = shareDetails;
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasSafeAlerts !== undefined) {
                                        let safeAlerts = await getsafeAlerts(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        if (safeAlerts.length > 0) {
                                            response["hits"]["hits"][0]["_source"]['safeAlerts'] = safeAlerts;
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasTradingAddress !== undefined) {
                                        let tradingAddress = await getTradingAddress(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        if (tradingAddress.length > 0) {
                                            response["hits"]["hits"][0]["_source"]['tradingAddress'] = tradingAddress;
                                        }
                                    }

                                    let documents = await getDocument(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                    response["hits"]["hits"][0]["_source"]['documents'] = documents;

                                    let getGroupStructureData = await getGroupStructure(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                    response["hits"]["hits"][0]["_source"]['getGroupStructure'] = getGroupStructureData;

                                    let companyCommentary = await getCompanyCommentary(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                    if (companyCommentary.length > 0) {
                                        response["hits"]["hits"][0]["_source"]['companyCommentary'] = companyCommentary;
                                        response["hits"]["hits"][0]["_source"]['hasCompanyCommentary'] = true;
                                    } else {
                                        response["hits"]["hits"][0]["_source"]['hasCompanyCommentary'] = false;
                                    }
                                    if (response["hits"]["hits"][0]["_source"] !== undefined) {

                                        /**Start remove credit safeNum, creditSafeDate */
                                        delete response["hits"]["hits"][0]["_source"].safeNum;
                                        if (response["hits"]["hits"][0]["_source"]['ccjDetails']) {
                                            response["hits"]["hits"][0]["_source"]['ccjDetails'].forEach(element => {
                                                delete element.creditSafeDate;
                                            });
                                        }
                                        if(response["hits"]["hits"][0]["_source"]['possibleCCJDeatils']) {
                                            response["hits"]["hits"][0]["_source"]['possibleCCJDeatils'].forEach(element => {
                                                delete element.creditSafeDate;
                                            });
                                        }
                                        /**End  remove credit safeNum, creditSafeDate */

                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getComprehensiveDetailsByCompany",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getComprehensiveDetailsByCompany",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: response["hits"]["hits"][0]["_source"],
                                                                    })
                                                                }
                                                            })
                                                        } if (data.length == 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getComprehensiveDetailsByCompany",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: response["hits"]["hits"][0]["_source"],
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }
                                                })

                                            }
                                        })
                                    }
                                }
                            }
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getCompanyRiskProfileByCompany/:companyNumber", async (req, res) => {
    let companyNumber = req.params.companyNumber.toString().toLowerCase();
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        await client.search({
                            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                            body: {
                                query: {
                                    term: {
                                        companyRegistrationNumber: companyNumber
                                    }
                                }
                            }
                        }, async (error, response) => {
                            if (error) {
                                console.log("Error: ", error);
                                return res.json({
                                    status: 404
                                });
                            } else {
                                var results = {};

                                if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {

                                    results["companyRegistrationNumber"] = response["hits"]["hits"][0]["_source"]["companyRegistrationNumber"];
                                    results["businessName"] = response["hits"]["hits"][0]["_source"]["businessName"];
                                    results["companyRegistrationDate"] = response["hits"]["hits"][0]["_source"]["companyRegistrationDate"];
                                    results["businessAlphaName"] = response["hits"]["hits"][0]["_source"]["businessAlphaName"];
                                    results["companyStatus"] = response["hits"]["hits"][0]["_source"]["companyStatus"];
                                    results["companyLiquidationStatus"] = response["hits"]["hits"][0]["_source"]["companyLiquidationStatus"];
                                    results["administrationOrderFlag"] = response["hits"]["hits"][0]["_source"]["administrationOrderFlag"];
                                    results["voluntaryAgreementFlag"] = response["hits"]["hits"][0]["_source"]["voluntaryAgreementFlag"];
                                    results["inAdministrationFlag"] = response["hits"]["hits"][0]["_source"]["inAdministrationFlag"];
                                    results["receiveManagerFlag"] = response["hits"]["hits"][0]["_source"]["receiveManagerFlag"];
                                    results["latestAnnualReturnDate"] = response["hits"]["hits"][0]["_source"]["latestAnnualReturnDate"];
                                    results["nextAnnualReturnDate"] = response["hits"]["hits"][0]["_source"]["nextAnnualReturnDate"];
                                    results["accountsFilingDate"] = response["hits"]["hits"][0]["_source"]["accountsFilingDate"];
                                    results["latestDateOfAccounts"] = response["hits"]["hits"][0]["_source"]["latestDateOfAccounts"];
                                    results["accountsDueDate"] = response["hits"]["hits"][0]["_source"]["accountsDueDate"];
                                    results["accountsMadeUpDate"] = response["hits"]["hits"][0]["_source"]["accountsMadeUpDate"];
                                    results["accountsReferenceDate"] = response["hits"]["hits"][0]["_source"]["accountsReferenceDate"];
                                    results["charityNumber"] = response["hits"]["hits"][0]["_source"]["charityNumber"];
                                    results["ftsea"] = response["hits"]["hits"][0]["_source"]["ftsea"];
                                    results["ftset"] = response["hits"]["hits"][0]["_source"]["ftset"];
                                    results["primarySicCode07"] = response["hits"]["hits"][0]["_source"]["primarySicCode07"];
                                    results["primarySicCode03"] = response["hits"]["hits"][0]["_source"]["primarySicCode03"];
                                    results["accountsType"] = response["hits"]["hits"][0]["_source"]["accountsType"];
                                    results["companyType"] = response["hits"]["hits"][0]["_source"]["companyType"];
                                    results["Industries"] = response["hits"]["hits"][0]["_source"]["Industries"];
                                    results["pin"] = response["hits"]["hits"][0]["_source"]["pin"];
                                    results["RegAddress_Modified"] = response["hits"]["hits"][0]["_source"]["RegAddress_Modified"];
                                    results["financialRatios"] = response["hits"]["hits"][0]["_source"]["financialRatios"];
                                    results["simplifiedAccounts"] = response["hits"]["hits"][0]["_source"]["simplifiedAccounts"];
                                    results["statutoryAccounts"] = response["hits"]["hits"][0]["_source"]["statutoryAccounts"];
                                    results["mortgagesObj"] = response["hits"]["hits"][0]["_source"]["mortgagesObj"];

                                    let getGroupStructureData = await getGroupStructure(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                    results['getGroupStructure'] = getGroupStructureData;

                                    if (response["hits"]["hits"][0]["_source"].hasLandCorporate !== undefined) {
                                        if (response["hits"]["hits"][0]["_source"].hasLandCorporate == true) {
                                            let landCorporateInfoData = await landCorporateInfoDataRelatedCompany(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                            if (landCorporateInfoData != 0) {
                                                results['landCorporateInfo'] = landCorporateInfoData;
                                            }
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasCCJInfo !== undefined) {
                                        let ccjDetails = await getCCJDetails(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        if (ccjDetails != 0) {
                                            results['ccjDetails'] = ccjDetails;
                                        }
                                    }
                                    if (response["hits"]["hits"][0]["_source"].hasSafeAlerts !== undefined) {
                                        let safeAlerts = await getsafeAlerts(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        if (safeAlerts.length > 0) {
                                            results['safeAlerts'] = safeAlerts;
                                        }
                                    }
                                    let companyCommentary = await getCompanyCommentary(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                    if (companyCommentary.length > 0) {
                                        results['companyCommentary'] = companyCommentary;
                                    }
                                    if (response["hits"]["hits"][0]["_source"] !== undefined) {
                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getCompanyRiskProfileByCompany",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getCompanyRiskProfileByCompany",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        } if (data.length == 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getCompanyRiskProfileByCompany",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }
                                                })

                                            }
                                        })
                                    }
                                }
                            }
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

//Acquisition Merger
app.get("/getAcquisitonMergerInformationByCompany/:compNo", async (req, res) => {

    let Company_Registration_Number_from_UI = req.params.compNo;
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        try {
                            if (Company_Registration_Number_from_UI == "") {
                                return res.json({
                                    status: 404,
                                    message: 'Company Number invalid'
                                });
                            } else {
                                await client.search({
                                    index: constants.ELASTIC_ACQUISITION_MERGER_INFORMATION_INDEX_NAME,
                                    body: {
                                        size: esUtilities.default_page_size,
                                        query: {
                                            bool: {
                                                should: [
                                                    { term: { acquiringCompanyRegistrationNumber: Company_Registration_Number_from_UI.toString() } },
                                                    { term: { acquiredCompanyRegistrationNumber: Company_Registration_Number_from_UI.toString() } }
                                                ]
                                            }
                                        }
                                    }
                                }, async (error, response) => {
                                    if (error) {
                                        console.log("Error: ", error);
                                        return res.json({
                                            status: 404
                                        });
                                    } else {
                                        let results = [];
                                        if (response["hits"] && response["hits"]["hits"].length > 0) {
                                            response["hits"]["hits"].forEach(element => {
                                                if(element._source) {
                                                    delete element._source.id;
                                                    results.push(element._source);
                                                }
                                            });
                                        }
                                        // if (results.length > 0) {
                                            loginModel.findOneAndUpdate({
                                                _id: new ObjectID(user_id)
                                            }, {
                                                $set: {
                                                    hits: hits - 1,
                                                    totalHitsCons: totalHitsCons + 1
                                                }
                                            }, (error, docs) => {
                                                if (error) {
                                                    console.log("Error Was occured Updating Limit ")
                                                    return res.status(400).json({ status: 400, message: "Error was Occured" })
                                                } if (docs) {
                                                    apiAccessDetailsModel.find({
                                                        userId: new ObjectID(user_id),
                                                        apiName: "getAcquisitonMergerInformationByCompany",
                                                    }, (error, data) => {
                                                        if (error) {
                                                            console.log("Error was Occured", error)
                                                        } if (data) {
                                                            if (data.length > 0) {
                                                                let hits = data[0]["hits"];
                                                                let currentdate = new Date().toISOString();
                                                                apiAccessDetailsModel.findOneAndUpdate({
                                                                    userId: new ObjectID(user_id),
                                                                    apiName: "getAcquisitonMergerInformationByCompany",
                                                                }, {
                                                                    $set: {
                                                                        hits: hits + 1,
                                                                        lastHitsDate: currentdate
                                                                    }
                                                                }, (error, docs) => {
                                                                    if (error) {
                                                                        console.log("Error Was Occured");
                                                                        return res.status(400).json({
                                                                            status: 400,
                                                                            message: "Message " + error
                                                                        })
                                                                    } if (docs) {
                                                                        return res.json({
                                                                            status: 200,
                                                                            message: 'Success',
                                                                            results: results
                                                                        });
                                                                    }
                                                                })
                                                            } if (data.length == 0) {
                                                                apiAccessDetailsModel.create({
                                                                    userId: new ObjectID(user_id),
                                                                    apiName: "getAcquisitonMergerInformationByCompany",
                                                                    hits: 1
                                                                }, (error, docs) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        return res.status(400).json({
                                                                            status: 400,
                                                                            message: "Message " + error
                                                                        });
                                                                    } if (docs) {
                                                                        return res.json({
                                                                            status: 200,
                                                                            message: 'Success',
                                                                            results: results
                                                                        });
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    })
    
                                                }
                                            })
                                        // } else {
                                        //     return res.json({
                                        //         status: 201,
                                        //         message: 'No data found'
                                        //     });
                                        // }
                                    }
                                });
                            }
                        } catch (error) {
                            return res.json({
                                status: 404,
                                message: 'Company Number invalid'
                            });
                        }
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getRelatedCompaniesAndDirectorsByCompanyOld/:companyNumber", async (req, res) => {
    try {
        let companyNumber = req.params.companyNumber.toString().toLowerCase();
        if (req.headers.authorization !== undefined) {
            user_id = req.headers.authorization.toString().split('_')[0];
            api_access_token = req.headers.authorization.toString().split('_')[1];
            let query = {
                _id: new ObjectID(user_id),
                api_access_token: parseInt(api_access_token)
            }
            loginModel.find(query, async (error, docs) => {
                if ("Error Was Occured", error) {
                    console.log(error);
                    return res.status(400).json({
                        status: 400,
                        message: "Error was Occurred"
                    })
                } if (docs) {
                    if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                        let hits = docs[0]["hits"];
                        let totalHitsCons = docs[0]["totalHitsCons"];
                        if (totalHitsCons === undefined) {
                            totalHitsCons = 0;
                        }
                        if (hits > 0) {
                            let activeDirectorsArray = [];
                            let activeDirectorCount = 0;
                            let relatedCompaniesArray = [];
                            let relativeDirectorsArray = [];
                            let relativeDirectorsAndCompany = {};

                            await client.search({
                                _source: ["directorsData.directorPnr","directorsData.directorRole", "directorsData.resigned_on"],
                                index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                                body: {
                                    query: {
                                        term: {
                                            companyRegistrationNumber: companyNumber
                                        }
                                    }
                                }
                            }, async (error, response) => {
                                if (error) {
                                    console.log("Error In related Companies And Directors: ", error);
                                    return res.json({
                                        status: 404
                                    });
                                } else {
                                    if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {
                                        if (response["hits"]["hits"][0]["_source"].directorsData !== undefined) {
                                            let directorsData = response["hits"]["hits"][0]["_source"].directorsData;
                                            if (directorsData.length > 0) {

                                                for (let i = 0; i < directorsData.length; i++) {
                                                    if ((directorsData[i].directorRole == 'director' || directorsData[i].directorRole == 'company secretary') && (directorsData[i].resigned_on == undefined || directorsData[i].resigned_on == null)) {
                                                        activeDirectorCount++;
                                                        activeDirectorsArray.push(directorsData[i]);
                                                    }
                                                }
                                                if (activeDirectorCount == activeDirectorsArray.length) {
                                                    for (let j = 0; j < activeDirectorsArray.length ; j++) {
                                                        if (activeDirectorsArray[j].directorPnr !== undefined) {
                                                            let relatedCompanies = await fetchCompaniesForDirector(activeDirectorsArray[j].directorPnr, companyNumber.toString().toLowerCase());
                                                            // console.log("here", relatedCompanies.length);
                                                            if (relatedCompanies.length > 0) {
                                                                for (let k = 0; k < relatedCompanies.length; k++) {
                                                                    let relatedCompanyObj = {
                                                                        companyNumber: relatedCompanies[k].companyRegistrationNumber,
                                                                        companyName: relatedCompanies[k].businessName,
                                                                        incorporationDate: relatedCompanies[k].companyRegistrationDate,
                                                                        address: relatedCompanies[k].RegAddress_Modified,
                                                                        category: relatedCompanies[k].companyType,
                                                                        sic_code: relatedCompanies[k].sicCode07,
                                                                        companyStatus: relatedCompanies[k].companyStatus,
                                                                    };
                                                                    if (relatedCompanies[k].mortgagesObj !== undefined) {
                                                                        relatedCompanyObj['chargesCount'] = relatedCompanies[k].mortgagesObj.length;
                                                                    }
                                                                    else {
                                                                        relatedCompanyObj['chargesCount'] = 0;
                                                                    }

                                                                    if (relatedCompanies[k].directorsData !== undefined) {
                                                                        relatedCompanyObj['totalDirectors'] = relatedCompanies[k].directorsData.length;
                                                                    }
                                                                    else {
                                                                        relatedCompanyObj['totalDirectors'] = 0;
                                                                    }

                                                                    for (let l = 0; l < relatedCompanies[k].directorsData.length; l++) {
                                                                        if (relatedCompanies[k].directorsData[l].directorPnr !== undefined) {
                                                                            // let linkedDirectorName = "";

                                                                            if (relatedCompanies[k].directorsData[l].directorPnr == activeDirectorsArray[j].directorPnr) {
                                                                                let forename = relatedCompanies[k].directorsData[l].detailedInformation.forename !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.forename !== null ? relatedCompanies[k].directorsData[l].detailedInformation.forename : "";
                                                                                let middlename = relatedCompanies[k].directorsData[l].detailedInformation.middlename !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.middlename !== null ? relatedCompanies[k].directorsData[l].detailedInformation.middlename : "";
                                                                                let surname = relatedCompanies[k].directorsData[l].detailedInformation.surname !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.surname !== null ? relatedCompanies[k].directorsData[l].detailedInformation.surname : "";
                                                                                let linkedDirectorName = toTitleCase(forename + " " + middlename + " " + surname);
                                                                                // relatedCompanyObj['linkedDirectorPnr'] = relatedCompanies[k].directorsData[l].directorPnr;
                                                                                relatedCompanyObj['linkedDirector'] = linkedDirectorName;
                                                                                relatedCompanyObj['appointedOn'] = relatedCompanies[k].directorsData[l].fromDate;

                                                                                if (relatedCompanies[k].directorsData[l].toDate !== undefined && relatedCompanies[k].directorsData[l].toDate !== null) {
                                                                                    relatedCompanyObj['resignedOn'] = relatedCompanies[k].directorsData[l].toDate;
                                                                                }
                                                                            }

                                                                            if (relatedCompanies[k].directorsData[l].directorPnr !== activeDirectorsArray[j].directorPnr) {
                                                                                let relatedDirectorObj = {
                                                                                    directorName: relatedCompanies[k].directorsData[l].postalTitle,
                                                                                    director: relatedCompanies[k].directorsData[l].directorPnr,
                                                                                    companyName: relatedCompanies[k].businessName,
                                                                                    companyNumber: relatedCompanies[k].companyRegistrationNumber,
                                                                                    role: relatedCompanies[k].directorsData[l].directorRole,
                                                                                    country: relatedCompanies[k].directorsData[l].detailedInformation.country !== null ? relatedCompanies[k].directorsData[l].detailedInformation.country : " - ",
                                                                                    appointmentDate: relatedCompanies[k].directorsData[l].fromDate,
                                                                                    detailedInformation: relatedCompanies[k].directorsData[l].detailedInformation,
                                                                                    serviceAddress: relatedCompanies[k].directorsData[l].serviceAddress
                                                                                }
                                                                                if (relatedCompanies[k].directorsData[l].toDate !== undefined && relatedCompanies[k].directorsData[l].toDate !== null && relatedCompanies[k].directorsData[l].toDate !== '') {
                                                                                    relatedDirectorObj['resignedOn'] = relatedCompanies[k].directorsData[l].toDate;
                                                                                }
                                                                                if (relatedCompanies[k].directorsData[l].detailedInformation !== undefined) {
                                                                                    if (relatedCompanies[k].directorsData[l].detailedInformation.nationality !== null && relatedCompanies[k].directorsData[l].detailedInformation.nationality !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.nationality !== '') {

                                                                                        // break
                                                                                        if (countryMap.has(relatedCompanies[k].directorsData[l].detailedInformation.nationality.toLowerCase())) {
                                                                                            relatedDirectorObj['nationality'] = relatedCompanies[k].directorsData[l].detailedInformation.nationality;
                                                                                            relatedDirectorObj['countryCode'] = countryMap.get(relatedCompanies[k].directorsData[l].detailedInformation.nationality.toLowerCase());
                                                                                        }
                                                                                    } else {
                                                                                        relatedDirectorObj['countryCode'] = " - ";
                                                                                        relatedDirectorObj['nationality'] = " - ";
                                                                                    }
                                                                                }

                                                                                for (let l = 0; l < relatedCompanies[k].directorsData.length; l++) {
                                                                                    if (relatedCompanies[k].directorsData[l].directorPnr !== undefined) {
                                                                                        if (relatedCompanies[k].directorsData[l].directorPnr == activeDirectorsArray[j].directorPnr) {
                                                                                            let forename = relatedCompanies[k].directorsData[l].detailedInformation.forename !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.forename !== null ? relatedCompanies[k].directorsData[l].detailedInformation.forename : "";
                                                                                            let middlename = relatedCompanies[k].directorsData[l].detailedInformation.middlename !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.middlename !== null ? relatedCompanies[k].directorsData[l].detailedInformation.middlename : "";
                                                                                            let surname = relatedCompanies[k].directorsData[l].detailedInformation.surname !== undefined && relatedCompanies[k].directorsData[l].detailedInformation.surname !== null ? relatedCompanies[k].directorsData[l].detailedInformation.surname : "";
                                                                                            let linkedDirectorName = toTitleCase(forename + " " + middlename + " " + surname);
                                                                                            // relatedDirectorObj['linkedDirectorPnr'] = relatedCompanies[k].directorsData[l].directorPnr;
                                                                                            relatedDirectorObj['linkedDirector'] = linkedDirectorName;
                                                                                            relatedDirectorObj['appointedOn'] = relatedCompanies[k].directorsData[l].fromDate;
                                                                                        }
                                                                                    }
                                                                                }
                                                                                relativeDirectorsArray.push(relatedDirectorObj)
                                                                            }
                                                                        }
                                                                    }
                                                                    relatedCompaniesArray.push(relatedCompanyObj);
                                                                    if (relatedCompaniesArray) {
                                                                        relativeDirectorsAndCompany['relatedCompanies'] = relatedCompaniesArray;
                                                                        // console.log("nitish",relatedCompaniesArray.length);
                                                                        relativeDirectorsAndCompany['relatedCompanies'] = relativeDirectorsAndCompany['relatedCompanies'].slice(0, 100);
                                                                    }
                                                                    if (relativeDirectorsArray) {
                                                                        relativeDirectorsAndCompany['relatedDirectors'] = relativeDirectorsArray;
                                                                        relativeDirectorsAndCompany['relatedDirectors'] = relativeDirectorsAndCompany['relatedDirectors'].slice(0, 100);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    loginModel.findOneAndUpdate({
                                                        _id: new ObjectID(user_id)
                                                    }, {
                                                        $set: {
                                                            hits: hits - 1,
                                                            totalHitsCons: totalHitsCons + 1
                                                        }
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log("Error Was occured Updating Limit ")
                                                            return res.status(400).json({ status: 400, message: "Error was Occured" })
                                                        } if (docs) {
                                                            apiAccessDetailsModel.find({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                            }, (error, data) => {
                                                                if (error) {
                                                                    console.log("Error was Occured", error)
                                                                } if (data) {
                                                                    if (data.length > 0) {
                                                                        let hits = data[0]["hits"];
                                                                        let currentdate = new Date().toISOString();
                                                                        apiAccessDetailsModel.findOneAndUpdate({
                                                                            userId: new ObjectID(user_id),
                                                                            apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                                        }, {
                                                                            $set: {
                                                                                hits: hits + 1,
                                                                                lastHitsDate: currentdate
                                                                            }
                                                                        }, (error, docs) => {
                                                                            if (error) {
                                                                                console.log("Error Was Occured");
                                                                                return res.status(400).json({
                                                                                    status: 400,
                                                                                    message: "Message "
                                                                                })
                                                                            } if (docs) {
                                                                                return res.json({
                                                                                    result: relativeDirectorsAndCompany,
                                                                                    status: 200
                                                                                })
                                                                            }
                                                                        })
                                                                    } if (data.length == 0) {
                                                                        apiAccessDetailsModel.create({
                                                                            userId: new ObjectID(user_id),
                                                                            apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                                            hits: 1
                                                                        }, (error, docs) => {
                                                                            if (error) {
                                                                                console.log(error);
                                                                                return res.status(400).json({
                                                                                    status: 400,
                                                                                    message: "Message "
                                                                                });
                                                                            } if (docs) {
                                                                                return res.json({
                                                                                    result: relativeDirectorsAndCompany,
                                                                                    status: 200
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                }
                                                            })

                                                        }
                                                    })
                                                }
                                            }
                                            else {
                                                return res.json({
                                                    message: "Data Not Found",
                                                    status: 404
                                                })
                                            }
                                        }
                                        else {
                                            return res.json({
                                                message: "Data Not Found",
                                                status: 404
                                            });
                                        }
                                    }
                                }
                            })
                        } else {
                            return res.status(403).json({
                                status: 403,
                                message: "No API hits left. !!"
                            })
                        }
                    } else {
                        console.log("Invalid User");
                        return res.status(400).json({
                            status: 400,
                            message: "Invalid User"
                        })
                    }
                }
            })
        } if (req.headers.authorization === undefined) {
            return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
        }
    } catch (err) {
        console.log("error", err);
    }
});


/** Passing array of pnr to fetch all related companies of directors */
app.get("/getRelatedCompaniesAndDirectorsByCompany/:companyNumber/:page", async (req, res) => {
    try {
        let companyNumber = req.params.companyNumber.toString().toLowerCase();
        let pageSize = 50;
        let pageNumber = parseInt(req.params.page);
        if (req.headers.authorization !== undefined) {
            user_id = req.headers.authorization.toString().split('_')[0];
            api_access_token = req.headers.authorization.toString().split('_')[1];
            let query = {
                _id: new ObjectID(user_id),
                api_access_token: parseInt(api_access_token)
            }
            loginModel.find(query, async (error, docs) => {
                if ("Error Was Occured", error) {
                    console.log(error);
                    return res.status(400).json({
                        status: 400,
                        message: "Error was Occurred"
                    })
                } if (docs) {
                    if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                        let hits = docs[0]["hits"];
                        let totalHitsCons = docs[0]["totalHitsCons"];
                        if (totalHitsCons === undefined) {
                            totalHitsCons = 0;
                        }
                        if (hits > 0) {
                            let activeDirectorsArray = [];
                            let activeDirectorCount = 0;
                            let relatedCompaniesArray = [];
                            let relativeDirectorsArray = [];
                            let relativeDirectorsAndCompany = {};

                            await client.search({
                                _source: ["directorsData.directorPnr", "directorsData.directorRole", "directorsData.appointment"],
                                index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                                body: {
                                    query: {
                                        term: {
                                            "companyRegistrationNumber.keyword": companyNumber
                                        }
                                    }
                                }
                            }, async (error, response) => {
                                if (error) {
                                    console.log("Error In related Companies And Directors: ", error);
                                    return res.json({
                                        status: 404
                                    });
                                } else {
                                    if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {
                                        if (response["hits"]["hits"][0]["_source"].directorsData !== undefined) {
                                            let directorsData = response["hits"]["hits"][0]["_source"].directorsData;
                                            if (directorsData.length > 0) {

                                                for (let i = 0; i < directorsData.length; i++) {
                                                    if ((directorsData[i].appointment.toLowerCase() == 'current appointment' ) ) {
                                                        activeDirectorCount++;
                                                        activeDirectorsArray.push(directorsData[i].directorPnr);
                                                    }
                                                }
                                                let relatedCompanies;
                                                if (activeDirectorsArray.length > 0) {
                                                    relatedCompanies = await fetchCompaniesForAllActiveDirectors(activeDirectorsArray, companyNumber.toString().toLowerCase()); /** Get All Related Companies for the active directors of search company */
                                                }
                                                if (activeDirectorsArray.length > 0) {
                                                    for (let i = 0; i < activeDirectorsArray.length; i++) {
                                                        let tempRelatedCompanies = [];
                                                        for (let j = 0; j < relatedCompanies.length; j++) {
                                                            for (let k = 0; k < relatedCompanies[j].directorsData.length; k++) {
                                                                if (relatedCompanies[j].directorsData[k].directorPnr === parseInt(activeDirectorsArray[i])) {
                                                                    /** Start Make a result set of related companies for each active director */
                                                                    let relatedCompanyObj = {
                                                                        companyNumber: relatedCompanies[j].companyRegistrationNumber,
                                                                        companyName: relatedCompanies[j].businessName,
                                                                        incorporationDate: relatedCompanies[j].companyRegistrationDate,
                                                                        address: relatedCompanies[j].RegAddress_Modified,
                                                                        category: relatedCompanies[j].companyType,
                                                                        sic_code: relatedCompanies[j].sicCode07,
                                                                        companyStatus: relatedCompanies[j].companyStatus
                                                                    };
                                                                    if (relatedCompanies[j].mortgagesObj !== undefined) {
                                                                        relatedCompanyObj['chargesCount'] = relatedCompanies[j].mortgagesObj.length;
                                                                    }
                                                                    else {
                                                                        relatedCompanyObj['chargesCount'] = 0;
                                                                    }
                                                                    if (relatedCompanies[j].directorsData !== undefined) {
                                                                        relatedCompanyObj['totalDirectors'] = relatedCompanies[j].directorsData.length;
                                                                    }
                                                                    else {
                                                                        relatedCompanyObj['totalDirectors'] = 0;
                                                                    }
                                                                    relatedCompanyObj['linkedDirectorPnr'] = relatedCompanies[j].directorsData[k].directorPnr;
                                                                    relatedCompanyObj['linkedDirectorName'] = relatedCompanies[j].directorsData[k].detailedInformation.fullname;
                                                                    if (relatedCompanies[j].directorsData[k].toDate !== undefined && relatedCompanies[j].directorsData[k].toDate !== null) {
                                                                        relatedCompanyObj['resignedOn'] = relatedCompanies[j].directorsData[k].toDate;
                                                                    }
                                                                    if (tempRelatedCompanies.length > 0) {
                                                                        let count = 0;
                                                                        for (let i = 0; i < tempRelatedCompanies.length; i++) {
                                                                            if (tempRelatedCompanies[i].companyNumber === relatedCompanyObj.companyNumber && tempRelatedCompanies[i].linkedDirectorName === relatedCompanyObj.linkedDirectorName) {
                                                                                count++;
                                                                            }
                                                                        }
                                                                        if (count === 0) {
                                                                            tempRelatedCompanies.push(relatedCompanyObj);
                                                                            relatedCompaniesArray.push(relatedCompanyObj);
                                                                        }
                                                                    } else {
                                                                        tempRelatedCompanies.push(relatedCompanyObj);
                                                                        relatedCompaniesArray.push(relatedCompanyObj);
                                                                    }
                                                                }
                                                                 /**End Make a result set of related companies for each active director */
                                                            }
                                                        }
                                                        /**Start Make a result set of related directors for each related company for each active director */
                                                        tempRelatedCompanies.forEach(tempCompany => {
                                                            relatedCompanies.forEach(company => {
                                                                if (company.companyRegistrationNumber === tempCompany.companyNumber) {
                                                                    company.directorsData.forEach(director => {
                                                                        if (director.directorPnr !== activeDirectorsArray[i]) {
                                                                            let relatedDirectorObj = {
                                                                                directorName: director.detailedInformation.fullname,
                                                                                director: director.directorPnr,
                                                                                companyName: company.businessName,
                                                                                companyNumber: company.companyRegistrationNumber,
                                                                                role: director.directorRole,
                                                                                country: director.detailedInformation.country !== null ? director.detailedInformation.country : " - ",
                                                                                appointmentDate: director.fromDate,
                                                                                detailedInformation: director.detailedInformation,
                                                                                serviceAddress: director.serviceAddress
                                                                            };
                                                                            if (director.toDate !== undefined && director.toDate !== null && director.toDate !== '') {
                                                                                relatedDirectorObj['resignedOn'] = director.toDate;
                                                                            }
                                                                            relatedDirectorObj['linkedDirectorPnr'] = tempCompany.linkedDirectorPnr;
                                                                            relatedDirectorObj['linkedDirectorName'] = tempCompany.linkedDirectorName;
                                                                            relativeDirectorsArray.push(relatedDirectorObj);
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        });
                                                        /**End Make a result set of related directors for each related company for each active director */
                                                    }

                                                    // console.log("data1", relativeDirectorsArray.length);
                                                    // console.log("data1", relativeDirectorsArray[1].length);
                                                    if (relatedCompaniesArray.length > 0) {
                                                        relativeDirectorsAndCompany['relatedCompanies'] = relatedCompaniesArray;
                                                        relativeDirectorsAndCompany['relatedCompanies'] = relativeDirectorsAndCompany['relatedCompanies'].slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
                                                    } else {
                                                        relativeDirectorsAndCompany['relatedCompanies'] = relatedCompaniesArray;
                                                    }
                                                    if (relativeDirectorsArray.length > 0) {
                                                        relativeDirectorsAndCompany['relatedDirectors'] = relativeDirectorsArray;
                                                        relativeDirectorsAndCompany['relatedDirectors'] = relativeDirectorsAndCompany['relatedDirectors'].slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
                                                    } else {
                                                        relativeDirectorsAndCompany['relatedDirectors'] = relativeDirectorsArray;
                                                    }
                                                    loginModel.findOneAndUpdate({
                                                        _id: new ObjectID(user_id)
                                                    }, {
                                                        $set: {
                                                            hits: hits - 1,
                                                            totalHitsCons: totalHitsCons + 1
                                                        }
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log("Error Was occured Updating Limit ")
                                                            return res.status(400).json({ status: 400, message: "Error was Occured" })
                                                        } if (docs) {
                                                            apiAccessDetailsModel.find({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                            }, (error, data) => {
                                                                if (error) {
                                                                    console.log("Error was Occured", error)
                                                                } if (data) {
                                                                    if (data.length > 0) {
                                                                        let hits = data[0]["hits"];
                                                                        let currentdate = new Date().toISOString();
                                                                        apiAccessDetailsModel.findOneAndUpdate({
                                                                            userId: new ObjectID(user_id),
                                                                            apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                                        }, {
                                                                            $set: {
                                                                                hits: hits + 1,
                                                                                lastHitsDate: currentdate
                                                                            }
                                                                        }, (error, docs) => {
                                                                            if (error) {
                                                                                console.log("Error Was Occured");
                                                                                return res.status(400).json({
                                                                                    status: 400,
                                                                                    message: "Message "
                                                                                })
                                                                            } if (docs) {
                                                                                return res.json({
                                                                                    result: relativeDirectorsAndCompany,
                                                                                    status: 200
                                                                                })
                                                                            }
                                                                        })
                                                                    } if (data.length == 0) {
                                                                        apiAccessDetailsModel.create({
                                                                            userId: new ObjectID(user_id),
                                                                            apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                                            hits: 1
                                                                        }, (error, docs) => {
                                                                            if (error) {
                                                                                console.log(error);
                                                                                return res.status(400).json({
                                                                                    status: 400,
                                                                                    message: "Message "
                                                                                });
                                                                            } if (docs) {
                                                                                return res.json({
                                                                                    result: relativeDirectorsAndCompany,
                                                                                    status: 200
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                }
                                                            })

                                                        }
                                                    });
                                                } else {
                                                    loginModel.findOneAndUpdate({
                                                        _id: new ObjectID(user_id)
                                                    }, {
                                                        $set: {
                                                            hits: hits - 1,
                                                            totalHitsCons: totalHitsCons + 1
                                                        }
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log("Error Was occured Updating Limit ")
                                                            return res.status(400).json({ status: 400, message: "Error was Occured" })
                                                        } if (docs) {
                                                            apiAccessDetailsModel.find({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                            }, (error, data) => {
                                                                if (error) {
                                                                    console.log("Error was Occured", error)
                                                                } if (data) {
                                                                    if (data.length > 0) {
                                                                        let hits = data[0]["hits"];
                                                                        let currentdate = new Date().toISOString();
                                                                        apiAccessDetailsModel.findOneAndUpdate({
                                                                            userId: new ObjectID(user_id),
                                                                            apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                                        }, {
                                                                            $set: {
                                                                                hits: hits + 1,
                                                                                lastHitsDate: currentdate
                                                                            }
                                                                        }, (error, docs) => {
                                                                            if (error) {
                                                                                console.log("Error Was Occured");
                                                                                return res.status(400).json({
                                                                                    status: 400,
                                                                                    message: "Message "
                                                                                })
                                                                            } if (docs) {
                                                                                return res.json({
                                                                                    result: relativeDirectorsAndCompany,
                                                                                    status: 200
                                                                                })
                                                                            }
                                                                        })
                                                                    } if (data.length == 0) {
                                                                        apiAccessDetailsModel.create({
                                                                            userId: new ObjectID(user_id),
                                                                            apiName: "getRelatedCompaniesAndDirectorsByCompany",
                                                                            hits: 1
                                                                        }, (error, docs) => {
                                                                            if (error) {
                                                                                console.log(error);
                                                                                return res.status(400).json({
                                                                                    status: 400,
                                                                                    message: "Message "
                                                                                });
                                                                            } if (docs) {
                                                                                return res.json({
                                                                                    result: relativeDirectorsAndCompany,
                                                                                    status: 200
                                                                                })
                                                                            }
                                                                        })
                                                                    }
                                                                }
                                                            })

                                                        }
                                                    });
                                                }
                                            }
                                            else {
                                                return res.json({
                                                    message: "Data Not Found",
                                                    status: 404
                                                })
                                            }
                                        }
                                        else {
                                            return res.json({
                                                message: "Data Not Found",
                                                status: 404
                                            });
                                        }
                                    } else {

                                    }
                                }
                            })
                        } else {
                            return res.status(403).json({
                                status: 403,
                                message: "No API hits left. !!"
                            })
                        }
                    } else {
                        console.log("Invalid User");
                        return res.status(400).json({
                            status: 400,
                            message: "Invalid User"
                        })
                    }
                }
            })
        } if (req.headers.authorization === undefined) {
            return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
        }
    } catch (err) {
        console.log("error", err);
    }
});
/** Passing array of pnr to fetch all related companies of directors */

app.get("/getActiveDirectorsByCompany/:companyNumber", async (req, res) => {
    let companyNumber = req.params.companyNumber.toString().toLowerCase();
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        await client.search({
                            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                            body: {
                                query: {
                                    term: {
                                        companyRegistrationNumber: companyNumber
                                    }
                                }
                            }
                        }, async (error, response) => {
                            if (error) {
                                console.log("Error: ", error);
                                return res.json({
                                    status: 404
                                });
                            } else {
                                if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {
                                    let temp = [];
                                    if (response["hits"]["hits"][0]["_source"]["directorsData"]) {
                                        for (let i = 0; i < response["hits"]["hits"][0]["_source"]["directorsData"].length; i++) {
                                            delete response["hits"]["hits"][0]["_source"]["directorsData"][i].directorPnr;
                                            if (!(response["hits"]["hits"][0]["_source"]["directorsData"][i]["toDate"])) {
                                                temp.push(response["hits"]["hits"][0]["_source"]["directorsData"][i]);
                                            }
                                        }
                                    }
                                    let results = {};
                                    results["directorsData"] = temp;
                                    if (response["hits"]["hits"][0]["_source"] !== undefined) {
                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getActiveDirectorsByCompany",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getActiveDirectorsByCompany",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        } if (data.length == 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getActiveDirectorsByCompany",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }
                                                })

                                            }
                                        })
                                    }
                                }
                            }
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getAllDirectorsByCompany/:companyNumber", async (req, res) => {
    let companyNumber = req.params.companyNumber.toString().toLowerCase();
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        await client.search({
                            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                            body: {
                                // _source: {
                                //     excludes: ["directorsData.directorPnr"]
                                // },
                                query: {
                                    term: {
                                        companyRegistrationNumber: companyNumber
                                    }
                                }
                            }
                        }, async (error, response) => {
                            if (error) {
                                console.log("Error: ", error);
                                return res.json({
                                    status: 404
                                });
                            } else {
                                if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {

                                    let results = {};
                                    results["directorsData"] = response["hits"]["hits"][0]["_source"]["directorsData"];
                                    if (results["directorsData"]) {
                                        results["directorsData"].forEach(element => {
                                            delete element.directorPnr;
                                        });
                                    }
                                    if (response["hits"]["hits"][0]["_source"] !== undefined) {
                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getAllDirectorsByCompany",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getAllDirectorsByCompany",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        } if (data.length == 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getAllDirectorsByCompany",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }
                                                })

                                            }
                                        })
                                    }
                                }
                            }
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        })
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getAllOfficersByCompany/:companyNumber", async (req, res) => {
    let companyNumber = req.params.companyNumber.toString().toLowerCase();
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        await client.search({
                            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
                            body: {
                                query: {
                                    term: {
                                        companyRegistrationNumber: companyNumber
                                    }
                                }
                            }
                        }, async (error, response) => {
                            if (error) {
                                console.log("Error: ", error);
                                return res.json({
                                    status: 404
                                });
                            } else {
                                if (response["hits"] && response["hits"]["hits"] && response["hits"]["hits"][0]) {
                                    // console.log("1st log: ",response["hits"]["hits"][0]["_source"]);
                                    
                                    let results = {};
                                    results["directorsData"] = response["hits"]["hits"][0]["_source"]["directorsData"];
                                    results["pscDetails"] = response["hits"]["hits"][0]["_source"]["pscDetails"];
                                    
                                    // console.log("2nd log: ",results);
                                    if (response["hits"]["hits"][0]["_source"].hasShareHolders !== undefined) {
                                        let shareDetails = await getShareDetails(response["hits"]["hits"][0]["_source"].companyRegistrationNumber);
                                        // console.log("3rd log: ",shareDetails);
                                        if (shareDetails.length > 0) {
                                            response["hits"]["hits"][0]["_source"]['shareDetails'] = shareDetails;
                                            results["shareDetails"] = shareDetails;
                                        }
                                    }

                                    if (response["hits"]["hits"][0]["_source"] !== undefined) {
                                        if (results["directorsData"]) {
                                            results["directorsData"].forEach(element => {
                                                delete element.directorPnr;
                                            });
                                        }
                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getAllOfficersByCompany",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getAllOfficersByCompany",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        } if (data.length == 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getAllOfficersByCompany",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.status(200).json({
                                                                        status: 200,
                                                                        message: 'Success',
                                                                        results: results,
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    }
                                                })

                                            }
                                        })
                                    }
                                }
                            }
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        })
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    })
                }
            }
        });
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get('/getDirectorDetailsDataById/:DirectorId', async (req, res, next) => {
    let pnr = parseInt(req.params.DirectorId);
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        let _Dir = await fetchCompaniesForDirector(pnr, undefined);
                        if (_Dir.length == 0) {
                            return res.status(400).json({ message: ' Not Found' })
                        } else {
                            let result = await formatDirectorsData(_Dir, pnr);
                            let confirmedCompanies = result;
                            dgsafeConnection.collection('cd01_director_details').find({
                                "PNR": pnr
                            }).project({ "Possible_PNR": 1 }).toArray(async function (err, response) {
                                if (err) {
                                    console.log(err);
                                    return res.json({
                                        status: 201,
                                        message: error
                                    })
                                } else {
                                    let possiblePNR = response[0].Possible_PNR !== undefined ? response[0].Possible_PNR : [];
                                    if (possiblePNR.length > 0) {
                                        var filtered = possiblePNR.filter(function (value, index, arr) { return value !== pnr; })
                                        let possiblePnrCompaniesArray = [];
                                        filtered.forEach(async (e, i) => {
                                            let _possibleDir = await fetchCompaniesForDirector(e, undefined);
                                            if (_possibleDir.length > 0) {
                                                let result = await formatDirectorsData(_possibleDir, e);
                                                possiblePnrCompaniesArray = possiblePnrCompaniesArray.concat(result);
                                            }

                                            if ((filtered.length - 1) == i) {
                                                let tempArray = [];
                                                possiblePnrCompaniesArray.forEach(element => {
                                                    if (!tempArray.includes(element)) {
                                                        tempArray.push(element)
                                                    }
                                                });
                                                loginModel.findOneAndUpdate({
                                                    _id: new ObjectID(user_id)
                                                }, {
                                                    $set: {
                                                        hits: hits - 1,
                                                        totalHitsCons: totalHitsCons + 1
                                                    }
                                                }, (error, docs) => {
                                                    if (error) {
                                                        console.log("Error Was occured Updating Limit ")
                                                        return res.status(400).json({ status: 400, message: "Error was Occured" })
                                                    } if (docs) {
                                                        apiAccessDetailsModel.find({
                                                            userId: new ObjectID(user_id),
                                                            apiName: "getDirectorDetailsDataById",
                                                        }, (error, data) => {
                                                            if (error) {
                                                                console.log("Error was Occured", error)
                                                            } if (data) {
                                                                if (data.length > 0) {
                                                                    let hits = data[0]["hits"];
                                                                    let currentdate = new Date().toISOString();
                                                                    apiAccessDetailsModel.findOneAndUpdate({
                                                                        userId: new ObjectID(user_id),
                                                                        apiName: "getDirectorDetailsDataById",
                                                                    }, {
                                                                        $set: {
                                                                            hits: hits + 1,
                                                                            lastHitsDate: currentdate
                                                                        }
                                                                    }, (error, docs) => {
                                                                        if (error) {
                                                                            console.log("Error Was Occured");
                                                                            return res.status(400).json({
                                                                                status: 400,
                                                                                message: "Message "
                                                                            })
                                                                        } if (docs) {
                                                                            return res.json({
                                                                                status: 200,
                                                                                results: {
                                                                                    "companies": confirmedCompanies,
                                                                                    "possibleComapnies": tempArray
                                                                                }
                                                                            });
                                                                        }
                                                                    })
                                                                } if (data.length === 0) {
                                                                    apiAccessDetailsModel.create({
                                                                        userId: new ObjectID(user_id),
                                                                        apiName: "getDirectorDetailsDataById",
                                                                        hits: 1
                                                                    }, (error, docs) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                            return res.status(400).json({
                                                                                status: 400,
                                                                                message: "Message "
                                                                            });
                                                                        } if (docs) {
                                                                            return res.json({
                                                                                status: 200,
                                                                                results: {
                                                                                    "companies": confirmedCompanies,
                                                                                    "possibleComapnies": tempArray
                                                                                }
                                                                            });
                                                                        }
                                                                    })
                                                                }
                                                            }
                                                        });
                                                    }
                                                });

                                            }
                                        });
                                    } else {
                                        loginModel.findOneAndUpdate({
                                            _id: new ObjectID(user_id)
                                        }, {
                                            $set: {
                                                hits: hits - 1,
                                                totalHitsCons: totalHitsCons + 1
                                            }
                                        }, (error, docs) => {
                                            if (error) {
                                                console.log("Error Was occured Updating Limit ")
                                                return res.status(400).json({ status: 400, message: "Error was Occured" })
                                            } if (docs) {
                                                apiAccessDetailsModel.find({
                                                    userId: new ObjectID(user_id),
                                                    apiName: "getDirectorDetailsDataByPNR",
                                                }, (error, data) => {
                                                    if (error) {
                                                        console.log("Error was Occured", error)
                                                    } if (data) {
                                                        if (data.length > 0) {
                                                            let hits = data[0]["hits"];
                                                            let currentdate = new Date().toISOString();
                                                            apiAccessDetailsModel.findOneAndUpdate({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getDirectorDetailsDataByPNR",
                                                            }, {
                                                                $set: {
                                                                    hits: hits + 1,
                                                                    lastHitsDate: currentdate
                                                                }
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log("Error Was Occured");
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    })
                                                                } if (docs) {
                                                                    return res.json({
                                                                        status: 200,
                                                                        results: {
                                                                            "companies": confirmedCompanies,
                                                                        }
                                                                    });
                                                                }
                                                            })
                                                        } if (data.length === 0) {
                                                            apiAccessDetailsModel.create({
                                                                userId: new ObjectID(user_id),
                                                                apiName: "getDirectorDetailsDataByPNR",
                                                                hits: 1
                                                            }, (error, docs) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    return res.status(400).json({
                                                                        status: 400,
                                                                        message: "Message "
                                                                    });
                                                                } if (docs) {
                                                                    return res.json({
                                                                        status: 200,
                                                                        results: {
                                                                            "companies": confirmedCompanies,
                                                                        }
                                                                    });
                                                                }
                                                            })
                                                        }
                                                    }
                                                });
                                            }
                                        });

                                    }
                                }
                            });
                        }
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        });
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    });
                }
            }
        });
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getCompanyShareHoldingsByCompany/:companyNumber", async (req, res) => {
    let companyNumber = req.params.companyNumber.toString().toLowerCase();
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        let query = {
                            match: {
                                "share_holder_reg.keyword": companyNumber.toUpperCase()
                            }
                        }
                        getComapnyBasicDetailsByCompanyNumber(companyNumber.toLowerCase()).then(
                            async (data) => {
                                if (data) {
                                    await client.search({
                                        index: constants.ELASTIC_SHARE_DETAILS_INDEX_NAME,
                                        body: {
                                            size: 1000,
                                            query: query
                                        }
                                    }, async (error, response) => {
                                        if (error) {
                                            console.log("Error: ", error);
                                            return res.json({
                                                status: 404
                                            });
                                        } else {
                                            let shareHoldings = [];
                                            if (response["hits"] && response["hits"]["hits"].length > 0) {
                                                for (let element of response["hits"]["hits"]) {
                                                    let companyInfo = await getComapnyBasicDetailsByCompanyNumber(element._source.companyRegistrationNumber.toString().toLowerCase());
                                                    if (companyInfo) {
                                                        element._source["companyInformation"] = companyInfo.companyData
                                                    }
                                                    shareHoldings.push(element._source);
                                                };
                                            }
                                            let companyData = data.companyData;
                                            companyData["shareholdings"] = shareHoldings;
                                            // console.log("shareholding", companyData);
                                            loginModel.findOneAndUpdate({
                                                _id: new ObjectID(user_id)
                                            }, {
                                                $set: {
                                                    hits: hits - 1,
                                                    totalHitsCons: totalHitsCons + 1
                                                }
                                            }, (error, docs) => {
                                                if (error) {
                                                    console.log("Error Was occured Updating Limit ")
                                                    return res.status(400).json({ status: 400, message: "Error was Occured" })
                                                } if (docs) {
                                                    apiAccessDetailsModel.find({
                                                        userId: new ObjectID(user_id),
                                                        apiName: "getCompanyShareHoldingsByCompany",
                                                    }, (error, data) => {
                                                        if (error) {
                                                            console.log("Error was Occured", error)
                                                        } if (data) {
                                                            if (data.length > 0) {
                                                                let hits = data[0]["hits"];
                                                                let currentdate = new Date().toISOString();
                                                                apiAccessDetailsModel.findOneAndUpdate({
                                                                    userId: new ObjectID(user_id),
                                                                    apiName: "getCompanyShareHoldingsByCompany",
                                                                }, {
                                                                    $set: {
                                                                        hits: hits + 1,
                                                                        lastHitsDate: currentdate
                                                                    }
                                                                }, (error, docs) => {
                                                                    if (error) {
                                                                        console.log("Error Was Occured");
                                                                        return res.status(400).json({
                                                                            status: 400,
                                                                            message: "Message "
                                                                        })
                                                                    } if (docs) {
                                                                        return res.status(200).json({
                                                                            status: 200,
                                                                            message: 'Success',
                                                                            results: companyData,
                                                                        })
                                                                    }
                                                                })
                                                            } if (data.length === 0) {
                                                                apiAccessDetailsModel.create({
                                                                    userId: new ObjectID(user_id),
                                                                    apiName: "getCompanyShareHoldingsByCompany",
                                                                    hits: 1
                                                                }, (error, docs) => {
                                                                    if (error) {
                                                                        console.log(error);
                                                                        return res.status(400).json({
                                                                            status: 400,
                                                                            message: "Message "
                                                                        });
                                                                    } if (docs) {
                                                                        return res.status(200).json({
                                                                            status: 200,
                                                                            message: 'Success',
                                                                            results: companyData,
                                                                        })
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        )
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        });
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    });
                }
            }
        });
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.get("/getUserMeetMeRelations", (req, res) => {
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        var userId = new ObjectID(user_id);
                        let query = [{
                            $match: {
                                "userId": userId
                            }
                        },
                        {
                            $sort: { created: -1 }
                        }];
                        meetMeModel.aggregate(query).allowDiskUse(true).exec(function (err, userLists) {
                            if (err || userLists.length == 0)
                                return res.status(201).json("No list for particular user");
                            if(userLists) {
                                console.log("userLists", userLists);
                                loginModel.findOneAndUpdate({
                                    _id: new ObjectID(user_id)
                                }, {
                                    $set: {
                                        hits: hits - 1,
                                        totalHitsCons: totalHitsCons + 1
                                    }
                                }, (error, docs) => {
                                    if (error) {
                                        console.log("Error Was occured Updating Limit ")
                                        return res.status(400).json({ status: 400, message: "Error was Occured" })
                                    } if (docs) {
                                        apiAccessDetailsModel.find({
                                            userId: new ObjectID(user_id),
                                            apiName: "getUserMeetMeRelations",
                                        }, (error, data) => {
                                            if (error) {
                                                console.log("Error was Occured", error)
                                            } if (data) {
                                                if (data.length > 0) {
                                                    let hits = data[0]["hits"];
                                                    let currentdate = new Date().toISOString();
                                                    apiAccessDetailsModel.findOneAndUpdate({
                                                        userId: new ObjectID(user_id),
                                                        apiName: "getUserMeetMeRelations",
                                                    }, {
                                                        $set: {
                                                            hits: hits + 1,
                                                            lastHitsDate: currentdate
                                                        }
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log("Error Was Occured");
                                                            return res.status(400).json({
                                                                status: 400,
                                                                message: "Message "
                                                            })
                                                        } if (docs) {
                                                            return res.json({
                                                                status: 200,
                                                                results: userLists
                                                            });
                                                        }
                                                    })
                                                } if (data.length === 0) {
                                                    apiAccessDetailsModel.create({
                                                        userId: new ObjectID(user_id),
                                                        apiName: "getUserMeetMeRelations",
                                                        hits: 1
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log(error);
                                                            return res.status(400).json({
                                                                status: 400,
                                                                message: "Message "
                                                            });
                                                        } if (docs) {
                                                            return res.json({
                                                                status: 200,
                                                                results: userLists
                                                            });
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    }
                                });
                            }    
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        });
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    });
                }
            }
        });
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }
});

app.post("/search", async (req, res) => {
    if (req.headers.authorization !== undefined) {
        user_id = req.headers.authorization.toString().split('_')[0];
        api_access_token = req.headers.authorization.toString().split('_')[1];
        let query = {
            _id: new ObjectID(user_id),
            api_access_token: parseInt(api_access_token)
        }
        loginModel.find(query, async (error, docs) => {
            if ("Error Was Occured", error) {
                console.log(error);
                return res.status(400).json({
                    status: 400,
                    message: "Error was Occurred"
                })
            } if (docs) {
                if (docs[0] != undefined && docs[0]["api_access_token"] == parseInt(api_access_token)) {
                    let hits = docs[0]["hits"];
                    let totalHitsCons = docs[0]["totalHitsCons"];
                    if (totalHitsCons === undefined) {
                        totalHitsCons = 0;
                    }
                    if (hits > 0) {
                        let esQuery = esUtilitiesSearch.constructElasticSearchNew(req);

                        // console.log("The Query is ", JSON.stringify(esQuery,undefined,2))
                        let pageSize =
                            req.body.pageSize == undefined ?
                                esUtilitiesSearch.default_page_size :
                                req.body.pageSize;
                        let startAfter = req.body.startAfter == undefined ? 0 : req.body.startAfter;

                        let sortOnDefault = [];
                        if (req.body.sortOn !== undefined) {
                            if (req.body.sortOn.length > 0) {
                                let sortingArray = req.body.sortOn;
                                for (let i = 0; i < sortingArray.length; i++) {
                                    for (let key in sortingArray[i]) {
                                        if (sortingElasticKeysMap.get(key) !== undefined && sortingElasticKeysMap.get(key) !== "") {
                                            let keyName = sortingElasticKeysMap.get(key).toString();
                                            let obj = getSortingObject(keyName, sortingArray[i][key]);
                                            sortOnDefault.push(obj);
                                        }
                                    }
                                }
                            }
                        }

                        let paginatedQuery = {
                            from: startAfter,
                            size: pageSize,
                            sort: sortOnDefault,
                            track_total_hits: true,
                            _source: { "excludes": ["pscData", "CountryOfOrigin", "Industry", "DissolutionDate", "PreviousName_9", "PreviousName_8", "PreviousName_7", "PreviousName_6", "PreviousName_5", "PreviousName_4", "PreviousName_3", "PreviousName_2", "PreviousName_1", "ConfStmtNextDueDate", "financeData", "PreviousName_10", "ConfStmtLastMadeUpDate"] },
                            // _source: { "excludes": ["id", "active_directors", "URI", "Returns", "Accounts", "LimitedPartnerships", "pin", "resigned_directors_count", "LimitedPartnerships"] },
                            query: esQuery
                        };

                        console.log("Elastic Query : ", JSON.stringify(paginatedQuery, undefined, 2));

                        Company.esSearch(paginatedQuery, esUtilitiesSearch.es_query_options, function (
                            err,
                            results
                        ) {
                            if (err) {
                                res.json({
                                    status: 404,
                                    error: err
                                });
                            }
                            if (results) {
                                loginModel.findOneAndUpdate({
                                    _id: new ObjectID(user_id)
                                }, {
                                    $set: {
                                        hits: hits - 1,
                                        totalHitsCons: totalHitsCons + 1
                                    }
                                }, (error, docs) => {
                                    if (error) {
                                        console.log("Error Was occured Updating Limit ")
                                        return res.status(400).json({ status: 400, message: "Error was Occured" })
                                    } if (docs) {
                                        apiAccessDetailsModel.find({
                                            userId: new ObjectID(user_id),
                                            apiName: "UserSearchAPI",
                                        }, (error, data) => {
                                            if (error) {
                                                console.log("Error was Occured", error)
                                            } if (data) {
                                                if (data.length > 0) {
                                                    let hits = data[0]["hits"];
                                                    let currentdate = new Date().toISOString();
                                                    apiAccessDetailsModel.findOneAndUpdate({
                                                        userId: new ObjectID(user_id),
                                                        apiName: "UserSearchAPI",
                                                    }, {
                                                        $set: {
                                                            hits: hits + 1,
                                                            lastHitsDate: currentdate
                                                        }
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log("Error Was Occured");
                                                            return res.status(400).json({
                                                                status: 400,
                                                                message: "Message "
                                                            })
                                                        } if (docs) {
                                                            res.json({
                                                                status: 200,
                                                                results: results["hits"],
                                                            });
                                                        }
                                                    })
                                                } if (data.length === 0) {
                                                    apiAccessDetailsModel.create({
                                                        userId: new ObjectID(user_id),
                                                        apiName: "UserSearchAPI",
                                                        hits: 1
                                                    }, (error, docs) => {
                                                        if (error) {
                                                            console.log(error);
                                                            return res.status(400).json({
                                                                status: 400,
                                                                message: "Message "
                                                            });
                                                        } if (docs) {
                                                            res.json({
                                                                status: 200,
                                                                results: results["hits"],
                                                            });
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        return res.status(403).json({
                            status: 403,
                            message: "No API hits left. !!"
                        });
                    }
                } else {
                    console.log("Invalid User");
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid User"
                    });
                }
            }
        });
    } if (req.headers.authorization === undefined) {
        return res.status(400).json({ status: 400, message: "You are Not Authorized User" })
    }

});

/** Function Used In API's */
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function fetchCompaniesForDirector(pnr, companyNumber) {
    return new Promise((resolve, reject) => {
        let count = 0;
        client.search({
            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
            body: {
                "size": 1000,
                "query": {
                    "nested": {
                        "path": "directorsData",
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "match": {
                                            "directorsData.directorPnr": parseInt(pnr)
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error In Fetching Related Companies: ", error);
                reject(error);
            } else {
                if (response["hits"] && response["hits"]["hits"]) {
                    let relatedCompaniesArray = [];
                    let relatedCompanyNumberArray = [];
                    for (let i = 0; i < response["hits"]["hits"].length; i++) {
                        if (response["hits"]["hits"][i]["_source"].companyRegistrationNumber !== companyNumber) {
                            count++;
                            relatedCompaniesArray.push(response["hits"]["hits"][i]["_source"]);
                            relatedCompanyNumberArray.push(response["hits"]["hits"][i]["_source"].companyRegistrationNumber);
                        }
                    }
                    if (count == relatedCompaniesArray.length) {
                        resolve(relatedCompaniesArray);
                    }
                }
            }
        })
    })
}

function fetchCompaniesForAllActiveDirectors(pnr, companyNumber) {
    return new Promise((resolve, reject) => {
        let count = 0;
        client.search({
            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
            size: 5000,
            _source: ["companyRegistrationNumber", "businessName", "companyRegistrationDate", "RegAddress_Modified", "companyType", "sicCode07", "companyStatus", "mortgagesObj", "directorsData"],
            body: {
                "query": {
                    "bool" : {
                        "must": [
                            {
                                "nested": {
                                    "path": "directorsData",
                                    "query": {
                                        "bool": {
                                            "must": [
                                                {
                                                    "terms": {
                                                        "directorsData.directorPnr": pnr
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }, 
                            {
                                "match": {
                                    "companyStatus.keyword": 'live'
                                }
                            }
                        ]
                    }
                    
                }
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error In Fetching Related Companies: ", error);
                reject(error);
            } else {
                if (response["hits"] && response["hits"]["hits"]) {
                    let relatedCompaniesArray = [];
                    let relatedCompanyNumberArray = [];
                    for (let i = 0; i < response["hits"]["hits"].length; i++) {
                        if (response["hits"]["hits"][i]["_source"].companyRegistrationNumber !== companyNumber) {
                            count++;
                            relatedCompaniesArray.push(response["hits"]["hits"][i]["_source"]);
                            relatedCompanyNumberArray.push(response["hits"]["hits"][i]["_source"].companyRegistrationNumber);
                        }
                    }
                    if (count == relatedCompaniesArray.length) {
                        resolve(relatedCompaniesArray);
                    }
                }
            }
        })
    })
} 

function contactInfoDataRelatedCompany(companyNumber) {
    return new Promise((resolve, reject) => {
        client.search({
            index: constants.ELASTIC_CONTACT_INFO_INDEX_NAME,
            body: {
                "track_total_hits": true,
                "query": {
                    "bool": {
                        "should": [{
                            "match": {
                                "registered_number": companyNumber.toUpperCase()
                            }
                        }]
                    }
                }
            }
        }, function (error, results) {
            if (error) {
                reject(error);
            } else {
                if (results["hits"]["total"]["value"] > 0) {
                    resolve(results["hits"]["hits"][0]["_source"])
                } else {
                    resolve(results["hits"]["total"]["value"])
                }
            }
        })
    })
}

function landCorporateInfoDataRelatedCompany(companyNumber) {
    return new Promise((resolve, reject) => {
        client.search({
            index: constants.ELASTIC_LAND_CORPORATE_INDEX_NAME,
            body: {
                "track_total_hits": true,
                "query": {
                    "nested": {
                        "path": "Company_Registration_No",
                        "query": {
                            "bool": {
                                "should": [
                                    {
                                        "match": {
                                            "Company_Registration_No.1": companyNumber.toUpperCase()
                                        }
                                    },
                                    {
                                        "match": {
                                            "Company_Registration_No.2": companyNumber.toUpperCase()
                                        }
                                    },
                                    {
                                        "match": {
                                            "Company_Registration_No.3": companyNumber.toUpperCase()
                                        }
                                    },
                                    {
                                        "match": {
                                            "Company_Registration_No.4": companyNumber.toUpperCase()
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        }, function (error, results) {
            if (error) {
                reject(error);
            } else {
                if (results["hits"]["total"]["value"] > 0) {
                    resolve(results["hits"]["hits"])
                } else {
                    resolve(results["hits"]["total"]["value"])
                }
            }
        })
    })
}

function getCCJDetails(companyNumber) {
    return new Promise(async (resolve, reject) => {
        await client.search({
            index: constants.ELASTIC_CCJ_INDEX_NAME,
            body: {
                size: esUtilities.default_page_size,
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber.toString().toLowerCase()
                    }
                },
                sort: [
                    {
                        ccjDate: { order: "desc" }
                    }
                ]
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error: ", error);
                reject(error);
            } else {
                let results = [];
                if (response["hits"] && response["hits"]["hits"].length > 0) {
                    response["hits"]["hits"].forEach(element => {
                        results.push(element._source);
                    });
                }
                resolve(results)
            }
        });
    })
}

function getShareDetails(companyNumber) {
    return new Promise(async (resolve, reject) => {
        await client.search({
            index: constants.ELASTIC_SHARE_DETAILS_INDEX_NAME,
            body: {
                size: esUtilities.default_page_size,
                "sort": [
                    { "numberOfSharesIssued": "desc" }
                ],
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber.toString().toLowerCase()
                    }
                }
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error: ", error);
                reject(error);
            } else {
                // console.log("4th log: ", response);
                let results = [];
                var total_shares_count = 0;

                if (response["hits"] && response["hits"]["hits"].length > 0) {
                    response["hits"]["hits"].forEach(element => {
                        total_shares_count += element._source.numberOfSharesIssued;
                    });
                    response["hits"]["hits"].forEach(element => {
                        element._source.total_shares = total_shares_count
                        var shares_percentage = (parseFloat(element._source.numberOfSharesIssued / total_shares_count) * 100).toFixed(2);
                        element._source.percentage_share = shares_percentage;
                        results.push(element._source);
                    });
                }
                resolve(results)
            }
        });

    });
}

function getsafeAlerts(companyNumber) {
    return new Promise(async (resolve, reject) => {
        await client.search({
            index: constants.ELASTIC_SAFE_ALERTS_INFORMATION_INDEX_NAME,
            body: {
                size: esUtilities.default_page_size,
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber.toString()
                    }
                },
                sort: [
                    {
                        alertDate: { order: "desc" }
                    }
                ]
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error: ", error);
                reject(error)
            } else {
                let results = [];
                if (response["hits"] && response["hits"]["hits"].length > 0) {
                    response["hits"]["hits"].forEach(element => {
                        results.push(element._source);
                    });
                }
                resolve(results)
            }
        });
    });
}

function getTradingAddress(companyNumber) {
    return new Promise(async (resolve, reject) => {
        await client.search({
            index: constants.ELASTIC_TRADING_ADDRESS_DETAILS_INDEX_NAME,
            body: {
                size: esUtilities.default_page_size,
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber.toString()
                    }
                }
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error: ", error);
                reject(error);
            } else {
                let results = [];
                if (response["hits"] && response["hits"]["hits"].length > 0) {
                    response["hits"]["hits"].forEach(element => {
                        results.push(element._source);
                    });
                }
                resolve(results);
            }
        });
    });
}

function getCharges(companyNumber) {
    return new Promise((resolve, reject) => {
        client.search({
            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
            body: {
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber
                    }
                }
            }
        }, async (error, results) => {
            if (error) {
                console.log("Error: ", error);
                reject(error)
            } else {
                if (results["hits"]["hits"][0]["_source"]["hasCharges"]) {
                    resolve(results["hits"]["hits"][0]["_source"]["mortgagesObj"])
                } else {
                    resolve('No Charges Data')
                }
            }
        });
    })
}

function getFinance(companyNumber) {
    return new Promise((resolve, reject) => {
        client.search({
            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
            body: {
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber
                    }
                }
            }
        }, async (error, results) => {
            if (error) {
                console.log("Error: ", error);
                reject(error)
            } else {
                if (results["hits"]["hits"][0]["_source"]["hasFinances"]) {
                    let res = {};
                    res["financialRatios"] = results["hits"]["hits"][0]["_source"]["financialRatios"];
                    res["simplifiedAccounts"] = results["hits"]["hits"][0]["_source"]["simplifiedAccounts"];
                    res["statutoryAccounts"] = results["hits"]["hits"][0]["_source"]["statutoryAccounts"];

                    resolve(res)
                } else {
                    resolve('No Finance Data')
                }
            }
        });
    })
}

function getGroupStructure(companyNumber) {
    return new Promise(async (resolve, reject) => {
        try {
            let ultimateParentRegistration = [];
            let cmpNo = companyNumber;
            if (cmpNo == undefined || cmpNo == "") {
                resolve('Company Number invalid');
            } else {
                await client.search({
                    index: constants.ELASTIC_GROUP_STRUCTURE_INDEX_NAME,
                    body: {
                        size: esUtilities.default_page_size,
                        _source: "ultimateParentCompanyRegistrationNumber",
                        query: {
                            term: {
                                companyRegistrationNumber: cmpNo.toLowerCase().toString()
                            }
                        }
                    }
                }, async (error, response) => {
                    if (error) {
                        console.log("Error: ", error);
                        reject(error)
                    }
                    else {
                        if (response["hits"]["total"]["value"] !== 0) {
                            let results = [];
                            if (response["hits"] && response["hits"]["hits"].length > 0) {
                                response["hits"]["hits"].forEach(element => {
                                    results.push(element._source);
                                    ultimateParentRegistration.push(element._source);
                                });
                            }
                            if (results != []) {
                                await client.search({
                                    index: constants.ELASTIC_GROUP_STRUCTURE_INDEX_NAME,
                                    body: {
                                        track_total_hits: true,
                                        size: esUtilities.default_page_size,
                                        query: {
                                            bool: {
                                                must: [
                                                    {
                                                        match: {
                                                            "ultimateParentCompanyRegistrationNumber.keyword": results[0].ultimateParentCompanyRegistrationNumber
                                                        }
                                                    }
                                                ]
                                            }

                                        }
                                    }
                                }, async (error, response) => {
                                    if (error) {
                                        console.log("Error: ", error);
                                        reject(error)
                                    } else {
                                        let data = [];
                                        if (response["hits"] && response["hits"]["hits"].length > 0) {
                                            response["hits"]["hits"].forEach(element => {
                                                data.push(element._source);
                                            });
                                        }
                                        resolve(data);
                                    }
                                });
                            }
                        }
                        else {
                            resolve('No Group Structure Found');
                        }
                    }
                });
            }
        } catch (error) {
            reject(error)
        }
    })
}

function getDocument(companyNumber) {
    return new Promise(async (resolve, reject) => {
        let companyNo = companyNumber;
        let randkey = keys[Math.floor(Math.random() * keys.length)];
        let a = new Buffer.from(randkey).toString('base64');
        let headers = { 'content-type': 'application/json', 'Authorization': 'Basic ' + a };
        var options = {
            url: "https://api.companieshouse.gov.uk/company/" + companyNo.toUpperCase() + "/filing-history?items_per_page=100",
            headers: headers
        };
        await request(options, async function (error, response) {
            if (error) {
                console.log('Error In Fetching Documents: ', error);
                reject(error)
            }
            else {
                if (typeof JSON.parse(response['body']) == 'object') {
                    let res = JSON.parse(response['body']);
                    resolve(res)
                } else {
                    reject(error)
                }
            }
        })
    })
}

function getFillingHistory(companyNumber, transactionId) {
    return new Promise( async (resolve, reject) => {
            let companyNo = companyNumber;
            let transacId = transactionId;
            let randkey = keys[Math.floor(Math.random() * keys.length)];
            let a = new Buffer.from(randkey).toString('base64');
            let headers = { 'content-type': 'application/json', 'Authorization': 'Basic ' + a };
            var options = {
                url: "https://api.companieshouse.gov.uk/company/" + companyNo.toUpperCase() + "/filing-history/"+ transacId,
                headers: headers
            };
            await request(options, async function (error, response) {
                if (error) {
                    console.log('Error In Fetching Documents: ', error);
                    reject(error)
                }
                else {
                    if (typeof JSON.parse(response['body']) == 'object') {
                        let res = JSON.parse(response['body']);
                        resolve(res)
                    } else {
                        reject(error)
                    }
                }
            })
    })
}

function getCompanyCommentary(companyNumber) {
    return new Promise((resolve, reject) => {
        client.search({
            index: constants.ELASTIC_COMPANY_COMMENTARY_INDEX_NAME,
            body: {
                size: esUtilities.default_page_size,
                query: {
                    term: {
                        companyRegistrationNumber: companyNumber.toString().toLowerCase()
                    }
                }
            }
        }, async (error, response) => {
            if (error) {
                console.log("Error: ", error);
                reject([])
            } else {
                let results = [];
                if (response["hits"] && response["hits"]["hits"].length > 0) {
                    response["hits"]["hits"].forEach(element => {
                        results.push(element._source);
                    });
                }
                resolve(results);
            }
        });
    })
}

function formatDirectorsData(dir, pnr) {
    let relatedCompanies = dir;
    let formattedRelatedCompanies = [];
    return new Promise(async (resolve, reject) => {
        for( let i = 0; i < relatedCompanies.length; i ++) {

            let obj = {
                "CompanyOriginalName" : relatedCompanies[i].businessName,
                "CompanyNumber" : relatedCompanies[i].companyRegistrationNumber,
                "RegAddress" : relatedCompanies[i].RegAddress_Modified,
                "CompanyCategory" : relatedCompanies[i].companyType,
                "CompanyStatus" : relatedCompanies[i].companyStatus,
                "DissolutionDate" : relatedCompanies[i].DissolutionDate,
                "IncorporationDate" : relatedCompanies[i].companyRegistrationDate,
                "Sic_Code_07" : relatedCompanies[i].sicCode07,
                "Sic_Code_03" : relatedCompanies[i].sicCode03,
                "hasLandCorporate" : relatedCompanies[i].hasLandCorporate,
                "hasAcquiredCompany" : relatedCompanies[i].hasAcquiredCompany,
                "hasAcquiringCompany" : relatedCompanies[i].hasAcquiringCompany,                
                "hascontactInfo" : relatedCompanies[i].hascontactInfo,
                "hasContactNumber" : relatedCompanies[i].hasContactNumber,
                "hasGroupStructure" : relatedCompanies[i].hasGroupStructure,
                "hasSafeAlerts" : relatedCompanies[i].hasSafeAlerts,                
                "hasTradingAddress" : relatedCompanies[i].hasTradingAddress,
                "hasFinances" : relatedCompanies[i].hasFinances,
                "hasWebsite"  : relatedCompanies[i].hasWebsite,
                "total_directors_count" : relatedCompanies[i].directorsData.length,
                "latestAnnualReturnDate" :  relatedCompanies[i].latestAnnualReturnDate !== undefined ? relatedCompanies[i].latestAnnualReturnDate : null,
                "nextAnnualReturnDate" :  relatedCompanies[i].nextAnnualReturnDate !== undefined ? relatedCompanies[i].nextAnnualReturnDate : null,
                "accountsFilingDate" :  relatedCompanies[i].accountsFilingDate !== undefined ? relatedCompanies[i].accountsFilingDate : null,
                "latestDateOfAccounts" :  relatedCompanies[i].latestDateOfAccounts !== undefined ? relatedCompanies[i].latestDateOfAccounts : null,
                "accountsDueDate" :  relatedCompanies[i].accountsDueDate !== undefined ? relatedCompanies[i].accountsDueDate : null,
                "accountsMadeUpDate" :  relatedCompanies[i].accountsMadeUpDate !== undefined ? relatedCompanies[i].accountsMadeUpDate : null,
                "accountsReferenceDate" :  relatedCompanies[i].accountsReferenceDate !== undefined ? relatedCompanies[i].accountsReferenceDate : null,
                "accountsType" :  relatedCompanies[i].accountsType !== undefined ? relatedCompanies[i].accountsType : null,
                "ConfStmtNextDueDate" : relatedCompanies[i].ConfStmtNelxtDueDate,
                "ConfStmtLastMadeUpDate" : relatedCompanies[i].ConfStmtLastMadeUpDate,
            }

            if (relatedCompanies[i].previousNames !== undefined && relatedCompanies[i].previousNames.length > 0 ) {
                obj ['previousNames'] = relatedCompanies[i].previousNames;
            }

            if(relatedCompanies[i].hasCCJInfo == true && relatedCompanies[i].ccjDetails.length > 0) {
                obj["hasCCJInfo"] = relatedCompanies[i].hasCCJInfo;
                obj["ccjCount"] = relatedCompanies[i].ccjDetails.length;
            } else {
                obj["hasCCJInfo"] = relatedCompanies[i].hasCCJInfo;
            }

            if(relatedCompanies[i].hasShareHolders === true) {
                let shareDetailsData = await getShareDetails(relatedCompanies[i].companyRegistrationNumber);
                obj['shareHoldersCount'] = shareDetailsData.length;
                obj['hasShareHolders'] = relatedCompanies[i].hasShareHolders;
            } else {
                obj['hasShareHolders'] = relatedCompanies[i].hasShareHolders;
            }

            if (relatedCompanies[i].mortgagesObj !== undefined && relatedCompanies[i].mortgagesObj.length > 0) {
                obj["hasCharges"] = true;
                obj['total_count'] = relatedCompanies[i].mortgagesObj.length;
                obj['part_satisfied_count'] = 0;
                obj['satisfied_count'] = 0;
                obj['unfiltered_count'] = 0
                relatedCompanies[i].mortgagesObj.forEach(mortgage => {
                    if (["b", "f", "p", "r"].includes(mortgage.memorandumNature)) {
                        obj['satisfied_count'] = obj['satisfied_count'] + 1;
                    }
                    if (mortgage.memorandumNature == 's') {
                        obj['part_satisfied_count'] = obj['part_satisfied_count'] + 1;
                    }
                    if (["t", "u", "v", "w", "x", "y", "z", null, ""].includes(mortgage.memorandumNature)) {
                        obj['unfiltered_count'] = obj['unfiltered_count'] + 1;
                    }
                });
            } else {
                obj["hasCharges"] = false;
                obj['total_count'] = 0;
                obj['part_satisfied_count'] = 0;
                obj['satisfied_count'] = 0;
                obj['unfiltered_count']
            }

            let companyCommentary = await getCompanyCommentary(relatedCompanies[i].companyRegistrationNumber);
                if (companyCommentary.length >0) {
                    obj['companyCommentaryCount'] = companyCommentary.length;
                    obj['hasCompanyCommentary'] = true;
                } else {
                    obj['hasCompanyCommentary'] = false;
                }

            let resignedCount = 0;
            for(let k = 0; k < relatedCompanies[i].directorsData.length; k++ ){
                if(relatedCompanies[i].directorsData[k].directorPnr == pnr) {
                    obj['directorData'] = relatedCompanies[i].directorsData[k];
                }
                else if (relatedCompanies[i].directorsData[k].directorPnr !== null && relatedCompanies[i].directorsData[k].directorPnr !== undefined) {
                    resignedCount ++ ;
                }
            }
            obj["resigned_directors_count"] = resignedCount
            obj["active_directors_count"] = obj["total_directors_count"] -resignedCount

            if(relatedCompanies[i].simplifiedAccounts !== undefined ) {
                if (relatedCompanies[i].simplifiedAccounts.length > 0)
                obj['financeData'] = relatedCompanies[i].simplifiedAccounts;
            }
            formattedRelatedCompanies.push(obj)
        }
        if( formattedRelatedCompanies.length == relatedCompanies.length) {
            resolve(formattedRelatedCompanies)
        } else {
            reject("No Data Found");
        }
    })
}

function getComapnyBasicDetailsByCompanyNumber(cmpNo) {
    return new Promise((resolve, reject) => {
        let elasticQuery = { 
            "from" : 0,
            "_source": ["businessName","companyStatus","companyType","companyRegistrationNumber","companyRegistrationDate","RegAddress_Modified","sicCode07"],
            "query": {
                "bool": {
                "must": [
                    {
                        "match": {
                          "companyRegistrationNumber.keyword": cmpNo.toString().toLowerCase()
                        }
                    }
                ]
                }
            }
        };
        client.search({
            index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
            body: elasticQuery
        }, async (error, response) => {
            if (error) {
                console.log("Error: ", error);
                reject (error)
            } else {
                if (response["hits"] && response["hits"]["hits"].length > 0) {
                    let companyData = response["hits"]["hits"][0]["_source"]    
                        let obj = { 
                            "found":true,
                            "companyData": companyData
                        }
                        resolve (obj)
                } else {
                    resolve ({"found":false,"companyData":{}})
                }
            }
        })
    });
}
/** Functions Ends Here  */

module.exports = app;
