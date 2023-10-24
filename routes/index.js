var express = require('express');
var router = express.Router();

/* final catch-all route to index.html defined last */
router.get('/*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

module.exports = router;
