const executeRequest = (requestURL, headers, method, body) => {
    var promise = new Promise(function (resolve, reject) {
        const URL = require('url');
        var actionURL = URL.parse(requestURL);

        const request = require(actionURL.protocol.substring(0, actionURL.protocol.length - 1));

        let options = {
            hostname: actionURL.host,
            method: method,
            headers: headers,
            path: actionURL.path
        };

        var dataValue;
        const req = request.request(options, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                dataValue = data;
                //callback({ 'data': dataValue, 'response': resp, 'error': null });
                if(resp.statusCode == 200 || resp.statusCode == 201)
                    resolve({ 'data': dataValue, 'response': resp, 'error': null });
                else
                    reject({ 'data': dataValue, 'response': resp, 'error': null });
            });
        });

        req.on('error', (e) => {
            //callback({ 'data': dataValue, 'response': null, 'error': e });
            reject({ 'data': dataValue, 'response': null, 'error': e })
        });

        if (body != null) {
            req.end(body)
        } else {
            req.end();
        }
    });
    return promise;
}

module.exports = {
    executeRequest: executeRequest
}