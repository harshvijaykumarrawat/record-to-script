///vXX.X/sobjects/SObjectName/describe/

const callout = require("./request")

const getDescriptionAll = (properties, object_name) => {
    var promise = new Promise(function (resolve, reject) {

        var requestURL = properties['baseURL'] +
            '/services/data/v' +
            properties['version'] +
            '/sobjects' +
            (object_name == 'ALL' ? '' : '/' + object_name + '/describe');
        console.log(requestURL);
        var request = callout.executeRequest(requestURL, { 'Authorization': 'OAuth ' + properties['sessionId'] }, 'GET', null);
        request.then(function (response) {
            resolve(response.data);
        });
        request.catch(function (response) {
            console.log(response);
            reject(response.error);
        });
    });
    return promise;
}

module.exports = {
    describe: getDescriptionAll
}