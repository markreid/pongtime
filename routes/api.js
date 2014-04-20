/**
 * API routes.
 */

var express = require('express');
var router = express.Router();

router.get('/test', function(req, res) {
  res.send('test complete');
});

module.exports = router;
