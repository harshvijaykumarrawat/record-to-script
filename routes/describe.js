var express = require('express');
var router = express.Router();

const describeModule = require('../modules/describe');
const recordModule = require('../modules/records');

router.post('/', function (req, res, next) {
  var body = req.body;
  var describe_resp = describeModule.describe(body, req.query.object);
  describe_resp.then((resp) => {
    var objects = {};
    var describe_response = JSON.parse(resp);
    if (req.query.object == 'ALL') {
      for (var i in describe_response.sobjects) {
        if (describe_response.sobjects[i].keyPrefix != null) {
          objects[describe_response.sobjects[i].keyPrefix] = describe_response.sobjects[i];
        }
      }
      res.send(JSON.stringify(objects));
    }
    res.send(JSON.stringify(describe_response));
  });
  describe_resp.catch((resp) => {
    res.send(resp);
  });
});

router.post('/record', function (req, res, next) {
  var body = req.body;
  var record_promise = recordModule.record(body, req.query.object, req.query.recordid, req.query.child);
  record_promise.then((resp) => {
    res.send(JSON.stringify(resp));
  });
  record_promise.catch((resp) => {
    res.send(resp);
  });
});

module.exports = router;
