/*this matches the fields defined in elastic search */
module.exports = {
    COMPANY_NAME: "CompanyName",
    COMPANY_NUMBER: "companyRegistrationNumber",
    COMPANY_NUMBER_OLD: "CompanyNumber",
    COMPANY_CATEGORY: "CompanyCategory",
    POSTCODE: "PostCode",
    COMPANY_STATUS: "CompanyStatus",
    INCORPORATION_DATE: "companyRegistrationDate",
    POST_CODE: "RegAddress_Modified.PostCode.keyword",
    POST_CODE_Corporate:"Postcode.keyword",
    COUNTRY: "RegAddress_Modified.Country.keyword",
    REG_ADDRESS: "RegAddress",
    SIC_CODE: "SICCode",
    SIC_CODE_2: "SICCode_2",
    SIC_CODE_4: "SICCode_4",
    SIC_TEXT1: "SICCode.SicText_1",
    SIC_TEXT2: "SICCode.SicText_2",
    SIC_TEXT3: "SICCode.SicText_3",
    SIC_TEXT4: "SICCode.SicText_4",
    ACTIVE_DIRECTORS: "directorsData",
    DIRECTOR_NAME: "directorsData.name",
    COUNTY: "RegAddress_Modified.County.keyword",
    POST_TOWN: "RegAddress_Modified.PostTown.keyword",
    ADDRESS_CAREOF: "RegAddress.CareOf",
    ADDRESS_POBOX: "RegAddress.POBox",
    ADDRESS_LINE1: "RegAddress.AddressLine1",
    ADDRESS_LINE2: "RegAddress.AddressLine2",
    FINANCE: "statutoryAccounts",
    MORTGAGES: "Mortgages",
    PSC: "pscDetails",
    PSC_ADDRESS: "pscDetails.address",
    PSC_NAME: "pscDetails.name",
    PSC_RESIDENCE_COUNTRY: "pscDetails.countryOfResidence.keyword",
    PSC_CONTROl: "pscDetails.natures_of_control",
    PSC_POSTCODE: "pscDetails.postalCode",
    PSC_NATIONALITY: "pscDetails.nationality.keyword",
    PSC_NATURE_OF_CONTROL: "pscDetails.natureOfControl.keyword",
    PSC_KIND: "pscDetails.controlType.keyword"

}