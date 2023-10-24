const callout = require("./request")

const get_record = (properties, object_name, record_id, child) => {
    var promise = new Promise(function (resolve, reject) {
        ///services/data/v43.0/sobjects/Account/00128000006XSggAAG/Contacts
        var requestURL = properties['baseURL'] +
            '/services/data/v' +
            properties['version'] +
            '/sobjects/' +
            object_name + '/' +
            record_id +
            (child != null ? '/' + properties['child'] : '');
        var request = callout.executeRequest(requestURL, { 'Authorization': 'Bearer ' + properties['sessionId'] }, 'GET', null);
        request.then(function (responseJSON) {
            var response = responseJSON.data;
            if (typeof response == 'string') {
                response = JSON.parse(response);
            }
            if (response.records != null) {
                resolve(response.records);
            } else {
                resolve([response]);
            }
        });
        request.catch(function (response) {
            reject(response.error);
        });
    });
    return promise;
}

module.exports = {
    record: get_record
}