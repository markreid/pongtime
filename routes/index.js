/**
 * Index routes.
 */

var express = require('express');
var router = express.Router();
var path = require('path');

// We always just return the client app, which calls the APIs
// and does the rest for itself.
router.get('/*', function(req, res){
  res.sendfile(path.join(__dirname, '../public/app/index.html'));
});

module.exports = router;
