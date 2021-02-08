module.exports = {

    /*---------------- Live Server Constants ----------------- */
    MONGO_URL_OFF: '11.0.24.31:52498',
    MONGO_DATABASE_NAME: 'data-gardener_Live',
    MONGO_DB_USER: 'growDG#readWrite',
    MONGO_DB_PWD: '#|r0|n#t##CDun#2019',
    LOGO_ADDRESS: 'https://app.datagardener.com/assets/layout/images/logo4-black-text.png', //Logo address for Dev
    HOSTS: [{
        host: '11.0.17.40',
        auth: 'elastic:cysECeL22cYSeCel',
        port: 18374
    }],
    SWAGGER : './swaggerDocuments/swagger_live.json',
    SWAGGER_ADMIN : './swaggerDocuments/swagger-admin-live.json',
    /*----------- Live Server Constants Ends Here ------------ */

    /*---------------- Test Server Constants ----------------- */
    MONGO_URL_OFF: 'test.datagardener.com:52498',
    MONGO_DATABASE_NAME: 'data-gardener_Live',
    // MONGO_DB_USER: 'DG-developer',
    MONGO_DB_USER: 'dgtestreadWrite',
    MONGO_DB_PWD: 'Dg-Tt-Wh-2020',
    /*----------- Test Server Constants Ends Here ------------ */

    /*---------------- Dev Server Constants ----------------- */
    // HOSTS: [{
    //     host: '61.246.37.69',
    //     auth: 'elastic:BzekE3S6kvk5HmJT',
    //     port: 16943
    // }],
    /*----------- Dev Server Constants Ends Here ------------ */

    /** Database Models */
    MONGO_DG_LOGIN: 'loginModel',
    MONGO_DG_SUBSCRIPTION: 'subscriptionMaster',
    MONGO_API_ACCESS_DETAILS: 'ApiAccessDetails',
    MONGO_MEET_ME_MASTER: 'meetMeMaster',
    MONGO_COMPANY_COLLECTION_NAME: 'companyMaster',
    /** Database Models Ends Here */

    /** Elastic Constants */
    ELASTIC_MAIN_COMPANY_INDEX_NAME: 'maincompanyindexall',  
    // ELASTIC_MAIN_COMPANY_INDEX_NAME: 'maincompanyindexupdated',
    // ELASTIC_MAIN_COMPANY_INDEX_NAME_LIVE : 'maincompanyindexupdated',
    ELASTIC_CCJ_INDEX_NAME: 'companyccjdetailsindex',
    ELASTIC_POSSIBLE_CCJ_INDEX_NAME: 'companypossibleccjdetails',
    ELASTIC_TRADING_ADDRESS_DETAILS_INDEX_NAME: 'tradingaddressdetailsindex',
    ELASTIC_ACQUISITION_MERGER_INFORMATION_INDEX_NAME: 'acquisitionmergerinformationindex',
    ELASTIC_SHARE_DETAILS_INDEX_NAME: 'sharedetails',
    ELASTIC_FINANCIAL_RATIOS_INDEX_NAME: 'financialratiosindex',
    ELASTIC_SIMPLIFIED_ACCOUNTS_INDEX_NAME: 'simplifiedaccounts',
    ELASTIC_SAFE_ALERTS_INFORMATION_INDEX_NAME: 'safealertsinformation',
    ELASTIC_COMPANY_STATUS_INDEX_NAME: 'companystatus',
    ELASTIC_COMPANY_COMMENTARY_INDEX_NAME: 'companycommentary',
    ELASTIC_GROUP_STRUCTURE_INDEX_NAME: 'groupstructure',
    ELASTIC_STATUTORY_COMPANY_ACCOUNTS_INDEX_NAME: 'statutorycompanyaccounts',
    ELASTIC_LAND_CORPORATE_INDEX_NAME: 'corporatelandmasterupdated',
    ELASTIC_LAND_REGISTRY_INDEX_NAME: 'landregistrymaster',
    ELASTIC_CONTACT_INFO_INDEX_NAME: 'contactinfomaster',
    /** Elastic COnstants Ends Here */

};
