/**
 * Index routes.
 */

var express = require('express');
var passport = require('passport');
var router = express.Router();
var path = require('path');


/**
 * Passport authentication routes
 */
router.get('/auth/google', passport.authenticate('google'));

router.get('/auth/google/return', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.get('/auth/logout', function(req, res){
    req.logout();
    res.redirect('/');
});



// We always just return the client app, which calls the APIs
// and does the rest for itself.
router.get('/*', function(req, res){
  res.sendfile(path.join(__dirname, '../public/app/index.html'));
});

module.exports = router;
