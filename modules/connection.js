const callout = require("./request")
const error_response_properties = [
    'sf:exceptionCode',
    'sf:exceptionMessage'
]
const response_properties = [
    'metadataServerUrl',
    'sandbox',
    'passwordExpired',
    'serverUrl',
    'sessionId',
    'orgHasPersonAccounts',
    'organizationId',
    'organizationMultiCurrency',
    'organizationName',
    'profileId',
    'sessionSecondsValid',
    'userEmail',
    'userFullName',
    'userId',
    'userLanguage',
    'userLocale',
    'userName',
    'userTimeZone',
    'userType',
    'userUiSkin',
    'accessibilityMode',
    'currencySymbol',
    'orgAttachmentFileSizeLimit',
    'orgDefaultCurrencyIsoCode',
    'orgDefaultCurrencyLocale',
    'orgDisallowHtmlAttachments'
];

const loginSalesforce = (properties) => {
    var promise = new Promise(function (resolve, reject) {
        var requestURL = properties['org'] + '/services/Soap/u/' + properties['version'];
        var requestBody = '<se:Envelope xmlns:se="http://schemas.xmlsoap.org/soap/envelope/"><se:Header/><se:Body><login xmlns="urn:partner.soap.sforce.com"><username>'
        requestBody += properties['username']
        requestBody += '</username><password>'
        requestBody += properties['password']
        requestBody += '</password></login></se:Body></se:Envelope>'

        var request = callout.executeRequest(requestURL, { 'SOAPAction': '""', 'Content-Type': 'text/xml', 'Accept': 'application/json' }, 'POST', requestBody);
        request.then(function (response) {
            var userInfo = {};
            var data = response.data;
            for (var i in response_properties) {
                userInfo[response_properties[i]] = data.substring(
                    data.indexOf('<' + response_properties[i] + '>') + response_properties[i].length + 2,
                    data.indexOf('</' + response_properties[i] + '>')
                )
            }
            userInfo.baseURL = userInfo.metadataServerUrl.split('/services/Soap/m/')[0];
            properties['login'] = userInfo
            userInfo.version = properties['version'];
            resolve(userInfo);
        });
        request.catch(function (response) {
            var userInfo = {};
            var data = response.data;
            for (var i in error_response_properties) {
                userInfo[error_response_properties[i]] = data.substring(
                    data.indexOf('<' + error_response_properties[i] + '>') + error_response_properties[i].length + 2,
                    data.indexOf('</' + error_response_properties[i] + '>')
                )
            }
            properties['login'] = userInfo
            reject(userInfo);
        });
    });
    return promise;
}

module.exports = {
    login: loginSalesforce
}