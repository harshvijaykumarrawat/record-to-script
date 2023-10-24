var express = require('express');
var router = express.Router();

const connection = require('../modules/connection')
const version = '44.0';
const client_id = '3MVG9ZL0ppGP5UrAAyjXrFzFuRjqrpWxRJH_h1Buw9NBXXTB5_3HMf.QVnH7VAT_pCwunEtUA9jskqKHfEuNv';
const recirect_url = encodeURIComponent('https://127.0.0.1:3000/oauth/resp');
router.post('/', function (req, res, next) {
  var body = req.body;
  body.version = version;
  var login = connection.login(body);
  login.then((resp) => {
    res.send(resp);
  });
  login.catch((resp) => {
    res.send(resp);
  });
});

router.post('/oauth', function (req, res, next) {
  var redirectURL = 'https://login.salesforce.com/services/oauth2/authorize' +
    '?response_type=code' +
    '&client_id=' + client_id +
    '&redirect_uri=' + recirect_url;
  res.send({ redirectURL: redirectURL });
});

router.post('/oauth/resp', function (req, res, next) {
  var redirectURL = 'https://login.salesforce.com/services/oauth2/authorize' +
    '?response_type=code' +
    'client_id='
  console.log(req.query);
  res.send();
});

module.exports = router;
