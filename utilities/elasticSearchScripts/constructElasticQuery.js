var constants = require('../../constants/constants');
var schemaConstants = require('../../constants/elasticSchemaConstants');

module.exports = {
    es_query_options: {
        index: constants.ELASTIC_MAIN_COMPANY_INDEX_NAME,
        type: '_doc'
    },
    default_page_size: 5000,

    constructElasticSearchNew: function (req) {
        // console.log("req.body",req.body);
        var objj = {};
        if ((typeof(req.body.filterData)) == "string") {
            req.body.filterData = JSON.parse(JSON.stringify(req.body.filterData))
        }
        // req.body.filterData = JSON.parse(req.body.filterData)
        if (req.body.filterData != undefined) {
            req.body.filterData.forEach((key) => {
                if(key.chip_group === "Company Name/Number") {
                    let tempArr =  [];
                    key.chip_values.forEach(cmpNo => {
                        tempArr.push(cmpNo.toLowerCase());
                    });
                    objj[key.chip_group] = tempArr;
                    objj["companySearchAndOr"] = key.companySearchAndOr 
                } else if(key.chip_group === "Director Name") {
                    let tempArr =  [];
                    key.chip_values.forEach(directorName => {
                        tempArr.push(directorName.toLowerCase());
                    });
                    objj[key.chip_group] = tempArr;
                    objj["directorNameSearchAndOr"] = key.directorNameSearchAndOr 
                } else if(key.chip_group === "PSC Name") {
                    objj[key.chip_group] = key.chip_values;
                    objj["pscNameSearchAndOr"] = key.pscNameSearchAndOr 
                } else if(key.chip_group === "Industry") {
                    objj[key.chip_group] = key.chip_industry_sic_codes;
                } else if(key.chip_group === "Company Age") {
                    objj[key.chip_group] = key.chip_values;
                    objj["ageOperator"] = key.ageOperator;
                } else if(key.chip_group == "Preferences") {
                    objj[key.chip_group] = key.preferenceOperator;
                } else if(key.chip_group == "Active Directors") {
                    let directorRange = key.chip_values[0];
                    if (directorRange[0] == "" || directorRange[0] == null ){
                        objj['activeMinVal']=0;
                    }                  
                    else {
                        objj['activeMinVal'] = parseInt(directorRange[0]);
                    }
                    if (directorRange[1] == "" || directorRange[1] == null){
                        objj['activeMaxVal']=9999;
                    }
                    else {
                        objj['activeMaxVal'] = parseInt(directorRange[1])
                    };
                } else if(key.chip_group == "Total Directors") {
                    let directorRange = key.chip_values[0];
                    if (directorRange[0] == "" || directorRange[0] == null){
                        objj['totalMinVal']=0;
                    }                  
                    else {
                        objj['totalMinVal'] = parseInt(directorRange[0]);
                    }
                    if (directorRange[1] == "" || directorRange[1] == null){
                        objj['totalMaxVal']=9999;
                    }
                    else {
                        objj['totalMaxVal'] = parseInt(directorRange[1])
                    }
                } else if (key.chip_group == "Post Code") {
                    let postCodeArray =[]
                    if (typeof(key.chip_values[0])==='string'){
                        let tempArray = key.chip_values[0].split(" ");
                        postCodeArray.push([tempArray[0]]);
                        postCodeArray.push(parseInt(tempArray[2]));
                        objj[key.chip_group] = postCodeArray[0];
                        objj['postCodeRadius'] = postCodeArray[1];
                    } else if (typeof(key.chip_values[0])==='object'){
                        let tempArray = key.chip_values[0][0].split(" ");
                        postCodeArray.push([tempArray[0]]);
                        postCodeArray.push(parseInt(tempArray[2]));
                        objj[key.chip_group] = postCodeArray[0];
                        objj['postCodeRadius'] = postCodeArray[1];
                        if(key.userLocation !== undefined) {
                            objj['userLocation'] = key.userLocation
                        }
                    }
                } else if (key.chip_group == 'Accounts Submission Overdue') {
                    key.chip_values = parseInt(key.chip_values[0].split(" ")[0]);
                    objj[key.chip_group] = key.chip_values;
                } else if (key.chip_group == "Post Town"){
                     let tempPostTown = key.chip_values;
                     if (tempPostTown.includes("Unknown")) { 
                        let index = tempPostTown.indexOf("Unknown")
                        tempPostTown.splice(index,1)
                        tempPostTown.push("")
                     }
                     objj[key.chip_group] = tempPostTown;
                } else if (key.chip_group == 'Charges Person Entitled') {
                    let tempArr =  [];
                    key.chip_values.forEach(personEntitled => {
                        tempArr.push(personEntitled.toLowerCase());
                    });
                    objj[key.chip_group] = tempArr;

                } else if(key.chip_group === "Auditor Name") {
                    let tempArr =  [];
                    key.chip_values.forEach(auditorName => {
                        tempArr.push(auditorName.toLowerCase());
                    });
                    if (tempArr.includes("unknown")){
                        let index = tempArr.indexOf("unknown")
                        tempArr.splice(index,1)
                        tempArr.push("")
                    } 
                    objj[key.chip_group] = tempArr;
                }else if(key.chip_group === "Category") {
                        let tempArr =  [];
                        key.chip_values.forEach(category => {
                            tempArr.push(category.toLowerCase());
                        });
                        if (tempArr.includes("unknown")){
                            let index = tempArr.indexOf("unknown")
                            tempArr.splice(index,1)
                            tempArr.push("")
                        } 
                        objj[key.chip_group] = tempArr;

                    }else if(key.chip_group === "Status") {
                        let tempArr =  [];
                        key.chip_values.forEach(status => {
                            tempArr.push(status.toLowerCase());
                        });
                        if (tempArr.includes("unknown")){
                            let index = tempArr.indexOf("unknown")
                            tempArr.splice(index,1)
                            tempArr.push("")
                        } 
                        objj[key.chip_group] = tempArr;
                } else if(key.chip_group === "Accountant Name") {
                    let tempArr =  [];
                    key.chip_values.forEach(accountantName => {
                        tempArr.push(accountantName.toLowerCase());
                    });
                    if (tempArr.includes("unknown")){
                        let index = tempArr.indexOf("unknown")
                        tempArr.splice(index,1)
                        tempArr.push("")
                    } 
                    objj[key.chip_group] = tempArr;
                } else if(key.chip_group === "Bank Name") {
                    let tempArr =  [];
                    key.chip_values.forEach(BankName => {
                        tempArr.push(BankName.toLowerCase());
                    });
                    if (tempArr.includes("unknown")){
                        let index = tempArr.indexOf("unknown")
                        tempArr.splice(index,1)
                        tempArr.push("")
                    } 
                    objj[key.chip_group] = tempArr;
                } else if(key.chip_group === "Bank Sort Code") {
                    let tempArr =  [];
                    key.chip_values.forEach(sortCode => {
                        if (sortCode.toLowerCase() !== "unknown"){
                            sortCode = sortCode.split(",")[0].toLowerCase()
                        }
                        tempArr.push(sortCode.toLowerCase());
                    });
                    if (tempArr.includes("unknown")){
                        let index = tempArr.indexOf("unknown")
                        tempArr.splice(index,1)
                        tempArr.push("")
                    }
                    objj[key.chip_group] = tempArr;
                } else {
                    // console.log("key group",key.chip_group,key.chip_values)
                    objj[key.chip_group] = key.chip_values;
                }
            })
        }
        
        let companyStatus = objj['Status'];
        let companyCategory = objj['Category'];
        let companyCounty = objj.County;
        let companyWard = objj.Ward;
        let companyConstituency = objj.Constituency;
        let companyEURegion = objj["EU Region"];
        let companyTrustName = objj["Trust Name"];
        let companyDistrictCode = objj["District Code"];
        let companyRegion = objj.Region;
        let companyCountry = objj.Country;
        let companyNameSearchAndOr = objj.companySearchAndOr;
        let companyNameorNumber = objj["Company Name/Number"];
        let postTown = objj['Post Town'];
        let keywordPostTown = objj['keywordPostTown'];
        let postCode = objj['Post Code'];
        let searchRadius = objj['postCodeRadius'];
        let keywordPostCode = objj['keywordPostCode'];
        let directorNameSearchAndOr = objj.directorNameSearchAndOr;
        let directorName = objj["Director Name"];
        let directorOccupation = objj["Director Occupation"];
        let directorNationality = objj["Director Nationality"];
        let directorRole = objj["Director Role"];
        let directorCountry = objj["Director Country"];
        let pscName = objj["PSC Name"];
        let pscNameSearchAndOr = objj.pscNameSearchAndOr;
        let pscNationality =  objj["PSC Nationality"];
        let pscNatureOfControl =  objj["PSC Nature Of Control"];
        let pscKind = objj["PSC Kind"];
        let pscResidenceCountry = objj["PSC Country"];
        let companyIndustry = objj["Industry"];
        let chargesStatus = objj["Charges Status"];
        let chargesClassification = objj["Charges Classification"];
        let companyAge = objj["Company Age"];
        let incorporationDate = objj["Incorporation Date"];
        let ageOperator = objj["ageOperator"];
        let preferences = objj["Preferences"];
        let hasFinances = undefined;
        let hasContactInfo = undefined;
        let hasLandCorporate = undefined;
        let hasCharges = undefined;
        let hasCCJInfo = undefined;
        let hasWebsite = undefined;
        let hasContactNumber = undefined;
        let dormant_status = undefined;
        let liquidation_status = undefined;
        let chargesPersonEntitled = objj['Charges Person Entitled'];
        let keywordsForPersonEntitled = objj['keywordPersonEntitled'];
        let accountSubmission = objj['Accounts Submission Overdue'];
        let accountsDueDate = objj['Accounts Due Date'];
        let accountsmadeupDate = objj['Accounts Made Up Date'];
        let confirmationStatement = objj['Confirmation Statement'];
        let accountsCategory = objj['Accounts Category'];
        let activeMinVal = objj['activeMinVal'];
        let activeMaxVal = objj['activeMaxVal'];
        let totalMinVal = objj['totalMinVal']; 
        let totalMaxVal = objj['totalMaxVal'];
        let userLocation = objj['userLocation'];
        let advancedFinanceData = objj['Advanced Financials'];
        let financeData = objj['Financials'];
        let auditorName = objj["Auditor Name"];
        let accountantName = objj["Accountant Name"];
        let bankName = objj["Bank Name"];
        let court = objj['Court'];
        let ccjStatus = objj['CCJ Status'];
        let sortCode = objj['Bank Sort Code'];
        // console.log(chargesPersonEntitled)
        if(preferences !== undefined) {
            if(preferences.length > 0) {
                for ( let i = 0; i < preferences.length; i++) {
                    if(preferences[i].hasFinances !== undefined) {
                        hasFinances = preferences[i].hasFinances;
                    }
                    if(preferences[i].hasContactInfo !== undefined) {
                        hasContactInfo = preferences[i].hasContactInfo;
                    }
                    if(preferences[i].hasLandCorporate !== undefined) {
                        hasLandCorporate = preferences[i].hasLandCorporate;
                    }
                    if(preferences[i].hasCharges !== undefined) {
                        hasCharges = preferences[i].hasCharges;
                    }
                    if(preferences[i].dormant_status !== undefined) {
                        dormant_status = preferences[i].dormant_status;
                    }
                    if(preferences[i].hasCCJInfo !== undefined) {
                        hasCCJInfo = preferences[i].hasCCJInfo;
                    }
                    if(preferences[i].hasWebsite !== undefined) {
                        hasWebsite = preferences[i].hasWebsite;
                    }
                    if(preferences[i].hasContactNumber !== undefined) {
                        hasContactNumber = preferences[i].hasContactNumber;
                    }
                    if(preferences[i].liquidation_status !== undefined) {
                        liquidation_status = preferences[i].liquidation_status;
                    }
                }
            }
        }

        let pscPostCode = req.body.pscPostCode
        // let userLocation = null;
        // if (req.body.lat !== undefined && req.body.lon !== undefined) {
        //     userLocation = {
        //         "lat": req.body.lat,
        //         "lon": req.body.lon
        //     }
        // }
        // let searchRadius = req.body.radius === undefined ? 10 : req.body.radius;
        // let companyIncorporation, companyIncorporationEnd;
        // if (req.body.companyIncorporation !== undefined) {
        //     companyIncorporation = (req.body.companyIncorporation);
        // }
        // if (req.body.companyIncorporationEnd !== undefined) {
        //     companyIncorporationEnd = (req.body.companyIncorporationEnd);
        // }
        let address = req.body.address;

        var queryArray = [];
        
        // Exclude empty company Names
        let excludeEmptyCompanyNames = {
            "bool": {
                "must_not" : [{
                    "match" : {
                        "businessName.keyword": ""
                    }
                }]
            }
        }
        queryArray.push(excludeEmptyCompanyNames);
        //Start of Company
        if (companyNameorNumber != undefined) {
            // console.log(companyNameorNumber)
            if (companyNameorNumber.toString().match(/^[0-9]+$/) != null) {
                for (let i = 0; i < companyNameorNumber.length; i++) {
                    var length_of_companyNameorNumber = companyNameorNumber[i].length;
                }
                
                if (length_of_companyNameorNumber < 8) {
                    switch (length_of_companyNameorNumber) {
                        case 7:
                            for (let i = 0; i < companyNameorNumber.length; i++) {
                                let number_of_companyNameorNumber = [];
                                let number_to_add_inFront  = "0" + companyNameorNumber[i];
                                number_of_companyNameorNumber.push(number_to_add_inFront);
                                companyNameorNumber = number_of_companyNameorNumber;
                            }
                            break;

                        case 6:
                            for (let i = 0; i < companyNameorNumber.length; i++) {
                                let number_of_companyNameorNumber = [];
                                let number_to_add_inFront  = "00" + companyNameorNumber[i];
                                number_of_companyNameorNumber.push(number_to_add_inFront);
                                companyNameorNumber = number_of_companyNameorNumber;
                            }
                            break;
                        
                            case 5:
                                for (let i = 0; i < companyNameorNumber.length; i++) {
                                    let number_of_companyNameorNumber = [];
                                    let number_to_add_inFront  = "000" + companyNameorNumber[i];
                                    number_of_companyNameorNumber.push(number_to_add_inFront);
                                    companyNameorNumber = number_of_companyNameorNumber;
                                }
                                break;

                                case 4:
                                for (let i = 0; i < companyNameorNumber.length; i++) {
                                    let number_of_companyNameorNumber = [];
                                    let number_to_add_inFront  = "0000" + companyNameorNumber[i];
                                    number_of_companyNameorNumber.push(number_to_add_inFront);
                                    companyNameorNumber = number_of_companyNameorNumber;
                                }
                                break;
                    }
                }
            }

            var nameNumArray = [];
            nameNumArray.push(this.constructIndQuery("terms", schemaConstants.COMPANY_NUMBER, companyNameorNumber));
            // nameNumArray.push(this.constructIndQuery("terms", schemaConstants.COMPANY_NAME_ORIGINAL, companyNameorNumber));
            nameNumArray.push ({
                "terms": {
                "businessName.keyword": [
                    companyNameorNumber.toString().toLowerCase()
                ]
                }
            })
            companyNameorNumber = companyNameorNumber.toString();
            var nameArray = companyNameorNumber.toString().toLowerCase().trim().split(" ");
            var conditionArray = [];
            for (var m = 0; m < nameArray.length; m++) {
                conditionArray.push({
                    "match": {
                        "businessName": nameArray[m]
                    }
                });
            }
            var companyNameQuery;
            if (companyNameSearchAndOr != undefined && companyNameSearchAndOr.toString().toLowerCase() == "and") {
                companyNameQuery = {
                    "bool": {
                        "must": conditionArray //can []

                    }
                };
            } else {
                companyNameQuery = {
                    "bool": {
                        "should": conditionArray

                    }
                };
            }

            //new name query
            nameNumArray.push(companyNameQuery);
            var nameNumberFinalQuery = {
                "bool": {
                    "should": nameNumArray
                }
            };
            queryArray.push(nameNumberFinalQuery);
        }

        if (companyStatus !== undefined) {
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "terms": {
                                "companyStatus.keyword": companyStatus
                            }
                        }
                    ]
                }
            })
        }

        if (companyCategory != undefined) {
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "terms": {
                                "companyType.keyword": companyCategory
                            }
                        }
                    ]
                }
            })
        }
        // local_authority_name
        if (postTown != undefined) {
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.local_authority_name.keyword": postTown
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if(keywordPostTown !== undefined) {
            if( keywordPostTown.length > 0 ) {
                queryArray.push({
                    "bool": {
                        "should": [
                            {
                                "wildcard": {
                                    "RegAddress_Modified.local_authority_name": keywordPostTown + '*'
                                }
                            }
                        ]
                    }
                })
            }
        }

        if (companyCounty !== undefined) {
            if (companyCounty.includes("Unknown")) {
                let index = companyCounty.indexOf("Unknown")
                companyCounty.splice(index,1)
                companyCounty.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.county.keyword": companyCounty
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyWard !== undefined) {
            if (companyWard.includes("Unknown")) {
                let index = companyWard.indexOf("Unknown")
                companyWard.splice(index,1)
                companyWard.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.ward_name.keyword": companyWard
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyConstituency !== undefined) {
            if (companyConstituency.includes("Unknown")) {
                let index = companyConstituency.indexOf("Unknown")
                companyConstituency.splice(index,1)
                companyConstituency.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.parliament_constituency_name.keyword": companyConstituency
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyEURegion !== undefined) {
            if (companyEURegion.includes("Unknown")) {
                let index = companyEURegion.indexOf("Unknown")
                companyEURegion.splice(index,1)
                companyEURegion.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.european_electoral_region_name.keyword": companyEURegion
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyTrustName !== undefined) {
            if (companyTrustName.includes("Unknown")) {
                let index = companyTrustName.indexOf("Unknown")
                companyTrustName.splice(index,1)
                companyTrustName.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.primary_trust_name.keyword": companyTrustName
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyDistrictCode !== undefined) {
            if (companyDistrictCode.includes("Unknown")) {
                let index = companyDistrictCode.indexOf("Unknown")
                companyDistrictCode.splice(index,1)
                companyDistrictCode.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.district_code.keyword": companyDistrictCode
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyRegion !== undefined) {
            if (companyRegion.includes("Unknown")) {
                let index = companyRegion.indexOf("Unknown")
                companyRegion.splice(index,1)
                companyRegion.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.region.keyword": companyRegion
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (companyCountry !== undefined) {
            if (companyCountry.includes("Unknown")) {
                let index = companyCountry.indexOf("Unknown")
                companyCountry.splice(index,1)
                companyCountry.push("")
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "RegAddress_Modified",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "RegAddress_Modified.country.keyword": companyCountry
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (postCode != undefined) {
            let modifiedPostCodeArray = [];
            for(let i = 0; i < postCode.length; i++) {
                if(postCode[i].toString().toLowerCase() == 'unknown') {
                    modifiedPostCodeArray.push("");
                } else {
                    modifiedPostCodeArray.push(postCode[i].toString().toLowerCase());
                }
            }
            if(searchRadius ===0 || searchRadius === undefined){
                if(postCode.length == modifiedPostCodeArray.length) {
                    queryArray.push({
                        "bool": {
                            "should": [
                              {
                                "nested": {
                                  "path": "RegAddress_Modified",
                                  "query": {
                                    "bool": {
                                      "should": [
                                        {
                                          "terms": {
                                            "RegAddress_Modified.postalCode.keyword": modifiedPostCodeArray
                                          }
                                        }
                                      ]
                                    }
                                  }
                                }
                              }
                            ]
                          }
                    })
                }
            }
        }

        if(keywordPostCode !== undefined) {
            if( keywordPostCode.length > 0 ) {
                queryArray.push({
                    "bool": {
                        "should": [
                            {
                                "nested": {
                                    "path": "RegAddress_Modified",
                                    "query": {
                                        "bool": {
                                            "should": [
                                                {
                                                    "wildcard": {
                                                        "RegAddress_Modified.postalCode": keywordPostCode + '*'
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                })
            }
        }

        if (companyIndustry != undefined) {
            let industry_array = [];
            let sic_code_array = [];
            for(let i = 0; i < companyIndustry.length; i++) {
                if(companyIndustry[i].length > 5) {
                    // if (companyIndustry[i] === "agriculture, forestry and fishing"){
                    //     companyIndustry[i] = "agriculture forestry and fishing";
                    // }
                    industry_array.push(companyIndustry[i])
                }
                else{
                    sic_code_array.push(companyIndustry[i])
                }
            }
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "Industries",
                                "query": {
                                    "bool": {
                                        "should": [
                                            {
                                                "terms": {
                                                    "Industries.SicIndustry_1.keyword":industry_array
                                                }

                                            },
                                            {
                                                "terms": {
                                                    "Industries.SicIndustry_2.keyword":industry_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "Industries.SicIndustry_3.keyword":industry_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "Industries.SicIndustry_4.keyword":industry_array
                                                }
                                            }

                                        ]
                                    }
                                }
                            }
                          },
                        {
                            "nested": {
                                "path": "sicCode_2",
                                "query": {
                                    "bool" : {
                                        "should" : [
                                            {
                                                "terms": {
                                                    "sicCode_2.SicNumber_1": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_2.SicNumber_2": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_2.SicNumber_3": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_2.SicNumber_4": sic_code_array
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            "nested": {
                                "path": "sicCode_4",
                                "query": {
                                    "bool" : {
                                        "should" : [
                                            {
                                                "terms": {
                                                    "sicCode_4.SicNumber_1": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_4.SicNumber_2": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_4.SicNumber_3": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_4.SicNumber_4": sic_code_array
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            "nested": {
                                "path": "sicCode07",
                                "query": {
                                    "bool" : {
                                        "should" : [
                                            {
                                                "terms": {
                                                    "sicCode07.SicNumber_1": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode07.SicNumber_2": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode07.SicNumber_3": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode07.SicNumber_4": sic_code_array
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            "nested": {
                                "path": "sicCode_3",
                                "query": {
                                    "bool" : {
                                        "should" : [
                                            {
                                                "terms": {
                                                    "sicCode_3.SicNumber_1": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_3.SicNumber_2": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_3.SicNumber_3": sic_code_array
                                                }
                                            },
                                            {
                                                "terms": {
                                                    "sicCode_3.SicNumber_4": sic_code_array
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }

        if (companyAge !== undefined)
        {
            if(ageOperator !== undefined) {
                let incorpDate = this.formatDateNew(this.getIncorpDateFromAge(parseFloat(companyAge[0].split(' ')[2])));
                if(ageOperator[0] === "greater") {
                    queryArray.push({
                        "range": {
                            "companyRegistrationDate": {
                                "lte": incorpDate,
                            }
                        }
                    });
                }
                if(ageOperator[0] === "less") {
                    queryArray.push({
                        "range": {
                            "companyRegistrationDate": {
                                "gte": incorpDate,
                            }
                        }
                    });
                }
            }
        }

        if (incorporationDate != undefined) {
            let companyIncorporation = objj["Incorporation Date"][0][0];
            let companyIncorporationEnd = objj["Incorporation Date"][0][1];
            let incorporationQuery = {};
            incorporationQuery[schemaConstants.INCORPORATION_DATE] = {
                "gte": companyIncorporation,
                "lte": (companyIncorporationEnd === undefined) ? companyIncorporation : companyIncorporationEnd,
                "boost": 2.0
            };
            queryArray.push({
                "range": incorporationQuery
            });
        }

        if (address !== undefined) {
            queryArray.push({
                "bool": {
                    "should": [{
                        "match": {
                            "RegAddress_Modified.CareOf": address.toLowerCase()
                        }
                    }, {
                        "match": {
                            "RegAddress_Modified.POBox": address.toLowerCase()
                        }
                    }, {
                        "match": {
                            "RegAddress_Modified.AddressLine1": address.toLowerCase()
                        }
                    }, {
                        "match": {
                            "RegAddress_Modified.AddressLine2": address.toLowerCase()
                        }
                    }]
                }
            });
        }

        if(accountsCategory !== undefined) {
            if(accountsCategory.length > 0) {
                accountsCategoryQuery = {
                    "bool": {
                        "must": [
                          {
                            "terms": {
                              "accountsType.keyword": accountsCategory
                            }
                          }
                        ]
                      }
                };
                queryArray.push(accountsCategoryQuery);
            }
        }

        //End of Company

        // Start of the Director
        if (directorName != undefined) {
            // directorName = directorName.toString().replace(/[^a-zA-Z0-9]/g, ' ');
            var directorArray = directorName.toString().trim().split(" ");
            var conditionArray = [];
            for (var m = 0; m < directorArray.length; m++) {
                conditionArray.push({
                    "match": {
                        "directorsData.detailedInformation.fullname": directorArray[m]
                    }
                });
            }

            var directorNameQuery;
            if (directorNameSearchAndOr != undefined && directorNameSearchAndOr.toString().toLowerCase() == "and") {
                directorNameQuery = {
                    "bool": {
                        "must": conditionArray

                    }
                };
            } else {
                directorNameQuery = {
                    "bool": {
                        "should": conditionArray

                    }
                };
            }
            var directorFinalQuery = {
                "nested": {
                    "path": "directorsData",
                    "query": {
                        "nested": {
                            "path": "directorsData.detailedInformation",
                            "query": directorNameQuery
                        }
                    }
                }
            };
            //new name query
            queryArray.push(directorFinalQuery);
        }

        if (directorNationality !== undefined) {
            if (directorNationality.includes("Unknown")) {
                let index = directorNationality.indexOf("Unknown");
                directorNationality.splice(index, 1);
                directorNationality.push("unknown");
                directorNationality.push("unknow");
            }
            let nationalityTerm = {};
            nationalityTerm[schemaConstants.ACTIVE_DIRECTORS + '.detailedInformation.nationality.keyword'] = directorNationality;
            let directorQuery = {};
            directorQuery = {
                "nested": {
                    "path": schemaConstants.ACTIVE_DIRECTORS + '.detailedInformation',
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": nationalityTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": directorQuery
                }
            });
        }

        if (directorOccupation !== undefined) {            
            if (directorOccupation.includes("Unknown")) {
                let index = directorOccupation.indexOf("Unknown");
                directorOccupation.splice(index, 1);
                directorOccupation.push("unknown");
                directorOccupation.push("");
            }
            let OccupationTerm = {};
            OccupationTerm[schemaConstants.ACTIVE_DIRECTORS + '.directorJobRole.keyword'] = directorOccupation;
            let OccupationQuery = {};
            OccupationQuery = {
                "nested": {
                    "path": schemaConstants.ACTIVE_DIRECTORS,
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": OccupationTerm
                            }]
                        }
                    }
                } 
            };
            let liveStatusQuery = {
                "match" : {
                    "companyStatus.keyword" : "live"
                }
            }
            let liquidationStatusQuery = {
                "match" : {
                    "companyLiquidationStatus.keyword" : ""
                }
            }
            queryArray.push({
                "bool": {
                    "should": OccupationQuery
                }
            });
            if (companyStatus === undefined) {
                queryArray.push(liveStatusQuery)
            }
            if (liquidation_status === undefined) {
                queryArray.push(liquidationStatusQuery)
            }
        }

        // if (directorStatus !== undefined && directorStatus !== "") {
        //     let directorQuery = {};
        //     if (directorStatus.toLowerCase() === 'active') {
        //         directorQuery = {
        //             "nested": {
        //                 "path": "active_directors",
        //                 "query": {
        //                     "bool": {
        //                         "must_not": [
        //                             {
        //                                 "exists": {
        //                                     "field": schemaConstants.ACTIVE_DIRECTORS + ".resigned_on"
        //                                 }
        //                             }
        //                         ]
        //                     }
        //                 }
        //             }
        //         };
        //     } else {
        //         directorQuery = {
        //             "nested": {
        //                 "path": "active_directors",
        //                 "query": {
        //                     "bool": {
        //                         "must": [
        //                             {
        //                                 "exists": {
        //                                     "field": schemaConstants.ACTIVE_DIRECTORS + ".resigned_on"
        //                                 }
        //                             }
        //                         ]
        //                     }
        //                 }
        //             }
        //         };
        //     }
        //     queryArray.push(directorQuery);
        // }

        if (directorRole !== undefined) {
            let roleTerm = {};
            roleTerm[schemaConstants.ACTIVE_DIRECTORS + '.directorRole.keyword'] = directorRole;
            let directorQuery = {};
            directorQuery = {
                "nested": {
                    "path": schemaConstants.ACTIVE_DIRECTORS,
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": roleTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": directorQuery
                }
            });
        }

        if (directorCountry !== undefined) {
            if (directorCountry.includes("Unknown")) {
                let index = directorCountry.indexOf("Unknown")
                directorCountry.splice(index,1)
                directorCountry.push("")
            }
            let roleTerm = {};
            roleTerm[schemaConstants.ACTIVE_DIRECTORS + '.detailedInformation.country.keyword'] = directorCountry;
            let directorQuery = {};
            directorQuery = {
                "nested": {
                    "path": schemaConstants.ACTIVE_DIRECTORS + '.detailedInformation',
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": roleTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": directorQuery
                }
            });
        }
        
        if ((activeMinVal !== undefined && activeMaxVal !== undefined)){
            let rangeTerm;
            rangeTerm = {
                "gte" : activeMinVal,
                "lte" : activeMaxVal,
                "boost" : 2.0
            }
            queryArray.push({                    
                "range":{
                    "activeDirectorsCount" : rangeTerm
                }                    
            })
        }

        if ((totalMinVal !== undefined && totalMaxVal !== undefined)){
            let rangeTerm;
            rangeTerm = {
                "gte" : totalMinVal,
                "lte" : totalMaxVal,
                "boost" : 2.0
            }
            queryArray.push({                    
                "range":{
                    "totalDirectorsCount" : rangeTerm
                }                
            })
        }
        //End of Directors

        //Start of PSC
        if (pscName != undefined) {
            // pscName = pscName.toString().replace(/[^a-zA-Z0-9]/g, ' ');
            pscName = pscName.toString().trim().toLowerCase();

            var pscNameQuery;
            if (pscNameSearchAndOr != undefined && pscNameSearchAndOr.toString().toLowerCase() == "and") {
                pscNameQuery = {
                    "match_phrase": {
                        "pscDetails.pscName": pscName

                    }
                };
            } else {
                pscNameQuery = {
                    "match": {
                        "pscDetails.pscName": pscName

                    }
                };
            }
            var pscFinalQuery = {
                "nested": {
                    "path": "pscDetails",
                    "query": pscNameQuery
                }
            };
            //new name query
            queryArray.push(pscFinalQuery);
        }

        if (pscResidenceCountry !== undefined) {
            let pscTerm = {};
            pscTerm[schemaConstants.PSC_RESIDENCE_COUNTRY] = pscResidenceCountry;

            let pscQuery = {};
            pscQuery = {
                "nested": {
                    "path": schemaConstants.PSC,
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": pscTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": pscQuery
                }
            });
        }

        // if (pscControl !== undefined) {
        //     let pscTerm = {};
        //     pscTerm[schemaConstants.PSC_CONTROl] = pscControl;

        //     let pscQuery = {};
        //     pscQuery = {
        //         "nested": {
        //             "path": schemaConstants.PSC,
        //             "query": {
        //                 "bool": {
        //                     "should": [{
        //                         "match": pscTerm
        //                     }]
        //                 }
        //             }
        //         }
        //     };
        //     queryArray.push({
        //         "bool": {
        //             "should": pscQuery
        //         }
        //     });
        // }

        if (pscPostCode !== undefined) {
            let pscTerm = {};
            let newPscPostCode = pscPostCode.toUpperCase().replace(/ /g, '');
            pscTerm[schemaConstants.PSC_POSTCODE] = newPscPostCode.split(/(?=.{3}$)/).join(' ');

            let pscQuery = {};
            pscQuery = {
                "nested": {
                    "path": schemaConstants.PSC,
                    "query": {
                        "bool": {
                            "must": [{
                                "term": pscTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": pscQuery
                }
            });
        }

        if (pscNationality !== undefined) {
            if (pscNationality.includes("Unknown")) {
                let index = pscNationality.indexOf("Unknown")
                pscNationality.splice(index,1)
                pscNationality.push("nationality unknown")
                pscNationality.push("unknown")
                pscNationality.push("")
            }
            let pscTerm = {};
            pscTerm[schemaConstants.PSC_NATIONALITY] = pscNationality;

            let pscQuery = {};
            pscQuery = {
                "nested": {
                    "path": schemaConstants.PSC,
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": pscTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": pscQuery
                }
            });
        }

        if (pscNatureOfControl !== undefined) {
            let pscTerm = {};
            pscTerm[schemaConstants.PSC_NATURE_OF_CONTROL] = pscNatureOfControl;

            let pscQuery = {};
            pscQuery = {
                "nested": {
                    "path": schemaConstants.PSC,
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": pscTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": pscQuery
                }
            });
        }

        if (pscKind !== undefined) {
            let pscTerm = {};
            pscTerm[schemaConstants.PSC_KIND] = pscKind;

            let pscQuery = {};
            pscQuery = {
                "nested": {
                    "path": schemaConstants.PSC,
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": pscTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": pscQuery
                }
            });
        }
        //End of PSC

        // Accounts Filters
        if (accountSubmission !== undefined) {
            // console.log(accountSubmission);
            let now = new Date();
            let date = ""
            let month = ""
            now.getDate() < 10 ? date = "0" + now.getDate().toString() : date = now.getDate().toString() ; 
            now.getMonth() + 1 < 10 ? month = "0" + (now.getMonth() +1).toString()  :month = (now.getMonth() +1).toString(); 
            now = date + "/" + month + "/" +  (now.getFullYear() - accountSubmission).toString();
            
            let query = {
                'bool': {
                    'must': [
                        {
                            "range" : {
                                "accountsDueDate" : {
                                    "lte": now,
                                    "format" : "dd/MM/yyyy || yyyy"
                                }
                            }
                        },
                        {
                            "match" : {
                                "companyStatus.keyword" : "live"
                            }
                        },
                        {
                            "match" : {
                                "companyLiquidationStatus.keyword" : ""
                            }
                        }
                    ]
                }
            }
            queryArray.push(query);

        }
        if (accountsDueDate !== undefined) {
            // console.log(accountsDueDate)
            queryArray.push({
                'bool': {
                    'must': [
                        {
                            "range": {
                                "accountsDueDate": {
                                    "gte": accountsDueDate[0][0],
                                    "lte": accountsDueDate[0][1],
                                    "format": "dd/MM/yyyy||yyyy"
                                }
                            }
                        }
                    ]
                }
            });
        }

        if (accountsmadeupDate !== undefined) {
            // console.log(accountsmadeupDate)
            queryArray.push({
                'bool': {
                    'must': [
                        {
                            "range": {
                                "accountsMadeUpDate": {
                                    "gte": accountsmadeupDate[0][0],
                                    "lte": accountsmadeupDate[0][1],
                                    "format": "dd/MM/yyyy||yyyy"
                                }
                            }
                        }
                    ]
                }
            });
        }

        if (confirmationStatement !== undefined) {
            // console.log(confirmationStatement)
            queryArray.push({
                'bool': {
                    'must': [
                        {
                            "range": {
                                "latestAnnualReturnDate": {
                                    "gte": confirmationStatement[0][0],
                                    "lte": confirmationStatement[0][1],
                                    "format": "dd/MM/yyyy||yyyy"
                                }
                            }
                        }
                    ]
                }
            });
        }
        // End Accounts Filters

        //Start of Charges
        if (chargesPersonEntitled != undefined) {
            let person_entitledforChargesQuery = {};
            person_entitledforChargesQuery = {
                "nested": {
                    "path": "mortgagesObj.mortgageDetails",
                    "query" : {
                        "bool": {
                            "must": [
                                {
                                    "terms": {
                                        "mortgagesObj.mortgageDetails.description.keyword": chargesPersonEntitled
                                    }
                                },
                                {
                                    "match": {
                                        "mortgagesObj.mortgageDetails.recordType.keyword": "persons entitled"
                                    }
                                }
                            ]
                        }
                    }
                }
            }

            queryArray.push({
                "bool": {
                    "should": person_entitledforChargesQuery
                }
            });
        }

        if (keywordsForPersonEntitled !== undefined) {
                if (keywordsForPersonEntitled.length > 0) {
                    queryArray.push({
                        "nested": {
                            "path": "chargesData.charge_details.persons_entitled",
                            "query": {
                                "bool": {
                                    "must": [
                                        {
                                            "match": {
                                                "chargesData.charge_details.persons_entitled.name": keywordsForPersonEntitled
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    })
                }
        }

        if (chargesStatus != undefined) {
            let chargesStatusQuery = {};
            let terms = []
            chargesStatus.forEach((status) => {
                if (status == "Outstanding") {
                    terms = terms.concat(["t","u","v","w","x","y","z",""]);
                } else if (status == "Fully Statisfied") {
                    terms = terms.concat(["b","f","p","r"]);
                } else {
                    terms = terms.concat(["s"])
                }
            });
            chargesStatusQuery = {
                "nested": { 
                    "path": "mortgagesObj",
                    "query": {
                        "bool": {
                            "should": [
                                {
                                    "terms": {
                                        "mortgagesObj.memorandumNature.keyword": terms
                                    }
                                }
                            ]
                        }
                    }
                }
            }
            queryArray.push({
                "bool": {
                    "should": chargesStatusQuery
                }
            });
        }

        if (chargesClassification != undefined) {
            let chargesClassificationQuery = {};
            if (chargesClassification.includes("Unknown")) {
                let index = chargesClassification.indexOf("Unknown")
                chargesClassification.splice(index, 1)
                chargesClassification.push("")
            }
            chargesClassificationQuery = {
                "nested": {
                    "path": "mortgagesObj.mortgageDetails",
                    "query": {
                        "bool": {
                            "must": [
                                {
                                    "terms": {
                                        "mortgagesObj.mortgageDetails.description.keyword": chargesClassification
                                    }
                                },
                                {
                                    "match": {
                                        "mortgagesObj.mortgageDetails.recordType.keyword" : "mortgage type" 
                                    }
                                }
                            ]
                        }
                    }
                }
            }

            queryArray.push({
                "bool": {
                    "should": chargesClassificationQuery
                }
            });
        }
        //End of Charges

        //Start of Advance Finance
        if (advancedFinanceData !== undefined && advancedFinanceData.length > 0) {
            let financeQueryArray = [];
            for (const financeRow of advancedFinanceData) {
                let financeQuery = {};
                let financeTerm1 = {};
                financeTerm1[schemaConstants.FINANCE + '.key_name'] = financeRow.key;
                let financeTerm2 = {};
                //build the query based upon the operation
                if ((financeRow.greater_than !== undefined ) && (financeRow.less_than === undefined || financeRow.less_than === "" || financeRow.less_than === null)) {
                    financeTerm2[schemaConstants.FINANCE + '.' + financeRow.key] = {
                        "gte": parseInt(financeRow.greater_than),
                        "boost": 2.0
                    };
                } else if ((financeRow.less_than !== undefined ) && (financeRow.greater_than === undefined || financeRow.greater_than === "" || financeRow.greater_than === null)) {
                    financeTerm2[schemaConstants.FINANCE + '.' + financeRow.key] = {
                        "lte": parseInt(financeRow.less_than),
                        "boost": 2.0
                    };
                }   else if ((financeRow.greater_than !== undefined || financeRow.greater_than !== "" || financeRow.greater_than !== null) && (financeRow.less_than !== undefined || financeRow.less_than !== "" || financeRow.less_than !== null) ) {
                    financeTerm2[schemaConstants.FINANCE + '.' + financeRow.key] = {
                        "gte": parseInt(financeRow.greater_than),
                        "lte": parseInt(financeRow.less_than),
                        "boost": 2.0
                    };
                }    
                let year = financeRow.selected_year;
                if (financeRow.condition === "or") {
                    financeQuery = {
                        "nested": {
                            "path": schemaConstants.FINANCE,
                            "query": {
                                "bool": {
                                    "should": [{
                                        "range": financeTerm2
                                    },
                                    {
                                        "range": {
                                            "statutoryAccounts.yearEndDate": {
                                                "gte" : (parseInt(financeRow.selected_year)).toString(),
                                                "lt" : (parseInt(financeRow.selected_year) + 1 ).toString(),
                                                // "lte" : financeRow.selected_year.toString(),
                                                "format" : "yyyy"
                                            }
                                        }
                                    }
                                    ]
                                }
                            }
                        }
                    };
                }
                else {
                    financeQuery = {
                        "nested": {
                            "path": schemaConstants.FINANCE,
                            "query": {
                                "bool": {
                                    "must": [{
                                        "range": financeTerm2
                                    },
                                    {
                                        "range": {
                                            "statutoryAccounts.yearEndDate": {
                                                "gte" : (parseInt(financeRow.selected_year)).toString(),
                                                "lt" : (parseInt(financeRow.selected_year) + 1 ).toString(),
                                                // "lte" : financeRow.selected_year.toString(),
                                                "format" : "yyyy"
                                            }
                                        }
                                    }
                                    ]
                                }
                            }
                        }
                    };
                }
                financeQueryArray.push(financeQuery);
            }

            queryArray.push({
                "bool": {
                    "must": financeQueryArray
                }
            });
        }
        //End of Advanced Finance

        //Start of Finance
        if (financeData !== undefined && financeData.length > 0) {
            let financeQueryArray = [];
            for (const financeRow of financeData) {
                let financeQuery = {};
                // let financeTerm1 = {};
                // financeTerm1[schemaConstants.FINANCE + '.key_name'] = financeRow.key;
                let financeTerm = {};
                //build the query based upon the operation
                if ((financeRow.greater_than !== undefined ) && (financeRow.less_than === undefined || financeRow.less_than === "" || financeRow.less_than === null)) {
                    financeTerm[schemaConstants.FINANCE + '.' + financeRow.key] = {
                        "gte": parseInt(financeRow.greater_than),
                        "boost": 2.0
                    };
                } else if ((financeRow.less_than !== undefined ) && (financeRow.greater_than === undefined || financeRow.greater_than === "" || financeRow.greater_than === null)) {
                    financeTerm[schemaConstants.FINANCE + '.' + financeRow.key] = {
                        "lte": parseInt(financeRow.less_than),
                        "boost": 2.0
                    };
                }   else if ((financeRow.greater_than !== undefined || financeRow.greater_than !== "" || financeRow.greater_than !== null) && (financeRow.less_than !== undefined || financeRow.less_than !== "" || financeRow.less_than !== null) ) {
                    financeTerm[schemaConstants.FINANCE + '.' + financeRow.key] = {
                        "gte": parseInt(financeRow.greater_than),
                        "lte": parseInt(financeRow.less_than),
                        "boost": 2.0
                    };
                }    
                
                financeQuery = {
                    "nested": {
                        "path": schemaConstants.FINANCE,
                        "query": {
                            "bool": {
                                "must": [{
                                    "range": financeTerm
                                }
                                ]
                            }
                        }
                    }
                };
            
                financeQueryArray.push(financeQuery);
            }

            queryArray.push({
                "bool": {
                    "must": financeQueryArray
                }
            });
        }
        //End of Finance

        // Start of Preferences
        if (dormant_status !== undefined) {
            let query = {}
            let operator = dormant_status === "exclude" ? "must_not" : "should"
            var dormant_query = {}
            query[operator] = [
                {
                    "nested": {
                        "path": "sicCode07",
                        "query": {
                            "terms": {
                                "sicCode07.SicNumber_1": ["99999", "74990", "7499", "9999"]
                            }
                        }
                    }
                },
                {
                    "nested": {
                        "path": "sicCode07",
                        "query": {
                            "terms": {
                                "sicCode07.SicNumber_2": ["99999", "74990", "7499", "9999"]
                            }
                        }
                    }
                },
                {
                    "nested": {
                        "path": "sicCode07",
                        "query": {
                            "terms": {
                                "sicCode07.SicNumber_3": ["99999", "74990", "7499", "9999"]
                            }
                        }
                    }
                },
                {
                    "nested": {
                        "path": "sicCode07",
                        "query": {
                            "terms": {
                                "sicCode07.SicNumber_4": ["99999", "74990", "7499", "9999"]
                            }
                        }
                    }
                }
            ];
            dormant_query = {
                bool: query
            }
            if (dormant_status !== "include") {
                queryArray.push(dormant_query);
            }

        }

        if (hasFinances !== undefined) {
            var has_Finances = {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "hasFinances": hasFinances
                            }
                        }
                    ]

                }
            }
            queryArray.push(has_Finances);
        }
        if (hasContactNumber !== undefined) {
            var has_ContactNumber = {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "hasContactNumber": hasContactNumber
                            }
                        }
                    ]

                }
            }
            queryArray.push(has_ContactNumber);
        }
        if (hasWebsite !== undefined) {
            var has_Website = {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "hasWebsite": hasWebsite
                            }
                        }
                    ]

                }
            }
            queryArray.push(has_Website);
        }
        if (hasCCJInfo !== undefined) {
            var has_CCJInfo = {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "hasCCJInfo": hasCCJInfo
                            }
                        }
                    ]

                }
            }
            queryArray.push(has_CCJInfo);
        }

        if (hasLandCorporate !== undefined) {
            var has_LandCorporate = {
                "bool": {
                    "must": [
                        {
                            "match_phrase": {
                                "hasLandCorporate": hasLandCorporate
                            }
                        }
                    ]

                }
            }
            queryArray.push(has_LandCorporate);
        }

        if (hasContactInfo !== undefined) {
            hasContactInfo = hasContactInfo == "true" ? true : false; 
            var has_ContactInfo = {
                "bool": {
                    "must": [
                        {
                            "match": {
                                "hascontactInfo": hasContactInfo
                            }
                        }
                    ]

                }
            }
            queryArray.push(has_ContactInfo);
        }
        
        if (hasCharges !== undefined) {
            let query = {} ;
            // console.log(hasCha)
            let operator =  hasCharges == "true" ? "must" : "must_not"
            query[operator] = [
                {
                    "nested": {
                        "path": "mortgagesObj",
                        "query": {
                            "exists": {
                                "field": "mortgagesObj.mortgageNumber"
                            }
                        }
                    }
                }
            ]
            var hasChargesQuery = {
                "bool": query
            }
            queryArray.push(hasChargesQuery);
        }

        if (liquidation_status !== undefined) {
            let templiquidation_status = undefined;
            liquidation_status === "exclude" ? templiquidation_status = "" : templiquidation_status = "in liquidation";
            var liquidation_status_query = {
                "match": {
                    "companyLiquidationStatus.keyword": templiquidation_status
                }
            }
            if (liquidation_status == "exclude" || liquidation_status == "only") {
                queryArray.push(liquidation_status_query)
            }

        }
        // End of Preferences

        // Admin Filters

        if (auditorName != undefined) {
            // console.log(auditorName)
            let roleTerm = {};
            roleTerm["auditorsQualificationCodes.auditors.keyword"] = auditorName;
            let auditorNameQuery = {};
            auditorNameQuery = {
                "nested": {
                    "path": "auditorsQualificationCodes",
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": roleTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": auditorNameQuery
                }
            });
        } 

        if (accountantName != undefined) {
            // console.log(accountantName)
            let roleTerm = {};
            roleTerm["auditorsQualificationCodes.accountantsName.keyword"] = accountantName;
            let accountantNameQuery = {};
            accountantNameQuery = {
                "nested": {
                    "path": "auditorsQualificationCodes",
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": roleTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": accountantNameQuery
                }
            });
        }

        if (bankName != undefined) {
            // console.log(bankName)
            let roleTerm = {};
            roleTerm["bankDetails.bankName.keyword"] = bankName;
            let bankNameQuery = {};
            bankNameQuery = {
                "nested": {
                    "path": "bankDetails",
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": roleTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": bankNameQuery
                }
            });
        }

        if (sortCode != undefined) {
            // console.log(sortCode)
            let roleTerm = {};
            roleTerm["bankDetails.sortCode.keyword"] = sortCode;
            let sortCodeQuery = {};
            sortCodeQuery = {
                "nested": {
                    "path": "bankDetails",
                    "query": {
                        "bool": {
                            "should": [{
                                "terms": roleTerm
                            }]
                        }
                    }
                }
            };
            queryArray.push({
                "bool": {
                    "should": sortCodeQuery
                }
            });
        }

        if (ccjStatus !== undefined) {
            ccjStatus.forEach((status) => {
                status = status.toLowerCase();
            });
            console.log(ccjStatus)
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "ccjDetails",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {
                                                "terms": {
                                                    "ccjDetails.ccjStatus.keyword": ccjStatus
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            "nested": {
                                "path": "possibleCCJDeatils",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {
                                                "terms": {
                                                    "possibleCCJDeatils.ccjStatus.keyword": ccjStatus
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }

        if (court !== undefined) {
            court.forEach((status) => {
                status = status.toLowerCase();
            });
            // console.log(court)
            queryArray.push({
                "bool": {
                    "should": [
                        {
                            "nested": {
                                "path": "ccjDetails",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {
                                                "terms": {
                                                    "ccjDetails.court.keyword": court
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            "nested": {
                                "path": "possibleCCJDeatils",
                                "query": {
                                    "bool": {
                                        "must": [
                                            {
                                                "terms": {
                                                    "possibleCCJDeatils.court.keyword": court
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            })
        }


        var finalQuery;

        if (userLocation != null) {
            //convert search radius to km its in miles
            searchRadius = searchRadius * 1.60934;
            let locationQuery = {
                "geo_distance": {
                    "distance": searchRadius + "km",
                    "pin.companyLocation": userLocation
                }
            };
            finalQuery = {
                "bool": {
                    "must": queryArray,
                    "filter": locationQuery
                }
            };
        } else {
            if (postCode == 'Unknown') {
                finalQuery = {
                    "bool": {
                        "must": queryArray
                    }
                };
            } else {
                finalQuery = {
                    "bool": {
                        "must": queryArray
                    }
                };
            }
        }
        return finalQuery;
    },

    constructIndQuery: function (matchType, paramName, paramValue) {
        let query = {};
        query[matchType] = {};
        query[matchType][paramName] = paramValue;
        return query;
    },

    constructAggQuery: function (aggBy) {

        if (aggBy == "chargesData.charge_details.status.keyword") {
            return this.constructAggObjectChargesStatus(aggBy);
        } else if (aggBy == "chargesData.charge_details.classification.description") {
            return this.constructAggObjectForNestedInNested(aggBy);
        }
        if (aggBy == "chargesData.charge_details.persons_entitled.name.keyword") {
            return this.constructAggObjectForNestedInNestedPerson_Entitled(aggBy);
        }        
        // if(aggBy == "active_directors.occupation" || aggBy == "active_directors.nationality" || aggBy == "active_directors.officer_role" || aggBy == "active_directors.country_of_residence" ) {
        //     return this.constructAggObjectForNestedDirectors(aggBy);
        // }
        if(aggBy == "directorsData.directorJobRole.keyword" || aggBy == "directorsData.directorRole.keyword") {
            return this.constructAggObjectForDirectors(aggBy);
        }
        if(aggBy == "directorsData.detailedInformation.nationality.keyword" || aggBy == "directorsData.detailedInformation.country.keyword") {
            return this.constructAggObjectForDirectorsNationality(aggBy);
        }
        if(aggBy== "pscDetails.natureOfControl.keyword" || aggBy == "pscDetails.controlType.keyword" || aggBy == "pscDetails.nationality.keyword" || aggBy == "pscDetails.countryOfResidence.keyword") {
            return this.constructAggObjectForNestedPSC(aggBy);
        }
        if(aggBy == "RegAddress_Modified.country.keyword" || aggBy == "RegAddress_Modified.county.keyword" || aggBy == "RegAddress_Modified.local_authority_name.keyword" || aggBy == "RegAddress_Modified.postalCode.keyword" || aggBy == "RegAddress_Modified.ward_name.keyword" || aggBy == "RegAddress_Modified.region.keyword" || aggBy == "RegAddress_Modified.parliament_constituency_name.keyword" || aggBy == "RegAddress_Modified.european_electoral_region_name.keyword" || aggBy == "RegAddress_Modified.primary_trust_name.keyword" || aggBy == "RegAddress_Modified.district_code.keyword") {
            return this.constructAggObjectForNestedAddress(aggBy);
        }
        // if(aggBy =="pscData.nationality.keyword" || aggBy == "pscData.natures_of_control.keyword" || aggBy == "pscData.kind" || aggBy == "pscData.country_of_residence") {
        //     return this.constructAggObjectForNestedPSC(aggBy);
        // }
        // if (aggBy == "Accounts.AccountCategory.keyword") {
        //     return this.constructAggObjectForAccountsCategory(aggBy);
        // }
        if (aggBy == "auditorsQualificationCodes.accountantsName.keyword" || aggBy == "auditorsQualificationCodes.auditors.keyword" ) {
            // console.log("here")
            return this.constructAggObjectForNestedAuditor(aggBy)
        }
        if (aggBy == "bankDetails.bankName.keyword" || aggBy == "bankDetails.sortCode.keyword" ) {
            // console.log("here")
            return this.constructAggObjectForNestedBankDetails(aggBy)
        }
        if (aggBy == "ccjStatus" || aggBy == "ccjCourt" ) {
            // console.log("here")
            return this.constructAggObjectForCCJ(aggBy)
        }

        else {
            return {
                "distinct_categories": {
                    "terms": {
                        "field": aggBy,
                        "size": 5000,
                        "order": {
                            // "_term": "asc"
                            // "_term" : "asc",
                            "_count": "desc"
                        }
                    }
                }
            }
        }
    },
  
    constructAggObjectForAccountsCategory: function (aggParam) {
        return {
            "accounts": {
                "nested": {
                    "path": "Accounts"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        }
                    }
                }
            }
        }
    },

    // constructAggObjectForNested: function (aggParam) {
    //     return {
    //         "chargesData": {
    //             "nested": {
    //                 "path": "chargesData.charge_details"
    //             },
    //             "aggs": {
    //                 "distinct_categories": {
    //                     "terms": {
    //                         "field": aggParam,
    //                         "size": 5000,
    //                         "order": {
    //                             // "_term": "asc"
    //                             // "_term" : "asc",
    //                             "_count": "desc"
    //                         }
    //                     },
    //                     "aggs": {
    //                         "parent_count": {
    //                             "reverse_nested": {}
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // },

    constructAggObjectForNestedInNested: function (aggParam) {
        return {
            "mortgagesObj": {
                "nested": {
                    "path": "mortgagesObj.mortgageDetails"
                },
                "aggs": {
                  "filter_types": {
                    "filter": {
                      "bool": {
                        "must": [
                          {
                            "match": {
                              "mortgagesObj.mortgageDetails.recordType.keyword": "mortgage type"
                            }
                          }
                        ]
                      }
                    },
                    "aggs": {
                      "distinct_categories": {
                        "terms": {
                          "field": "mortgagesObj.mortgageDetails.description.keyword",
                          "size": 5000,
                          "order": {
                            "_count": "desc"
                          }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                      }
                    }
                  }
                }
            }
        }
    },

    constructAggObjectForNestedInNestedPerson_Entitled: function (aggParam) {
        return {
            "mortgagesObj": {
                "nested": {
                    "path": "mortgagesObj.mortgageDetails"
                },
                "aggs": {
                  "filter_types": {
                    "filter": {
                      "bool": {
                        "must": [
                          {
                            "match": {
                              "mortgagesObj.mortgageDetails.recordType.keyword": "persons entitled"
                            }
                          }
                        ]
                      }
                    },
                    "aggs": {
                      "distinct_categories": {
                        "terms": {
                          "field": "mortgagesObj.mortgageDetails.description.keyword",
                          "size": 5000,
                          "order": {
                            "_count": "desc"
                          }
                        },
                        "aggs": {
                          "parent_count": {
                            "reverse_nested": {}
                          }
                        }
                      }
                    }
                  }
                }
            }
        }
    },

    constructAggObjectChargesStatus: (aggParam) => {
        return {
            "mortgagesObj": {
                "nested": {
                    "path": "mortgagesObj"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": "mortgagesObj.memorandumNature.keyword",
                            "size": 5000,
                            "order": {
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForDirectors: function (aggParam) {
        return {
            "directorsData": {
                "nested": {
                    "path": "directorsData"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForDirectorsNationality: function (aggParam) {
        return {
            "directorsData": {
                "nested": {
                    "path": "directorsData.detailedInformation"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForNestedPSC: function (aggParam) {
        return {
            "pscDetails": {
                "nested": {
                    "path": "pscDetails"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForNestedAddress: function (aggParam) {
        return {
            "RegAddress_Modified": {
                "nested": {
                    "path": "RegAddress_Modified"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForNestedAuditor: function (aggParam) {
        // console.log("HERE Somewhere",aggParam)
        return {
            "auditorsQualificationCodes" : {
                "nested" : {
                    "path" : "auditorsQualificationCodes"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        } ,"aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForNestedBankDetails: function (aggParam) {
        // console.log("HERE Somewhere",aggParam)
        return {
            "bankDetails" : {
                "nested" : {
                    "path" : "bankDetails"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": aggParam,
                            "size": 5000,
                            "order": {
                                // "_term": "asc"
                                // "_term" : "asc",
                                "_count": "desc"
                            }
                        } ,"aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    constructAggObjectForCCJ: function (aggParam) {
        // console.log("HERE Somewhere",aggParam)
        if (aggParam == 'ccjStatus') {
            var field = "ccjDetails.ccjStatus.keyword"
            var field1 = "possibleCCJDeatils.ccjStatus.keyword"
        } else if (aggParam == "ccjCourt") {
            var field = "ccjDetails.court.keyword"
            var field1 = "possibleCCJDeatils.court.keyword"
        }
        return {
            "ccj": {
                "nested": {
                    "path": "ccjDetails"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": field,
                            "size": 5000,
                            "order": {
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            },
            "possibleCCJ": {
                "nested": {
                    "path": "possibleCCJDeatils"
                },
                "aggs": {
                    "distinct_categories": {
                        "terms": {
                            "field": field1,
                            "size": 5000,
                            "order": {
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "parent_count": {
                                "reverse_nested": {}
                            }
                        }
                    }
                }
            }
        }
    },

    CamelCaseConvert: function (_str) {
        // this.Comparison();
        return _str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },

    formatDateNew(date) {
        var darr = date.split("-");
        var dd = darr[0];
        var mm = darr[1];
        var yyyy = darr[2];
        if (dd === '1' || dd === '2' || dd === '3' || dd === '4' || dd === '5' || dd === '6' || dd === '7' || dd === '8' || dd === '9') {
            if (parseInt(darr[0]) < 10) {
                dd = '0' + darr[0];
            }
        }
        if (mm === '1' || mm === '2' || mm === '3' || mm === '4' || mm === '5' || mm === '6' || mm === '7' || mm === '8' || mm === '9') {
            if (parseInt(darr[1]) < 10) {
                mm = '0' + darr[1];
            }
        }
        var new_date = dd + '/' + mm + '/' + yyyy;
        return new_date;
    },

    pad_with_zeroes: function (number, length) {
        var my_string = '' + number;
        while (my_string.length < length) {
            my_string = '0' + my_string;
        }
        return my_string;
    },

    getIncorpDateFromAge:function (ageInYears) {
          let days;
          days = ageInYears * 365;
          let date = new Date();
          let last = new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
          let day = last.getDate();
          let month = last.getMonth() + 1;
          let year = last.getFullYear();
          let dateFromAge = day + "-" + month + "-" + year;
        return dateFromAge;
      }

}