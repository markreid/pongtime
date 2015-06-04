/**
 * Index routes.
 */
'use strict';

var express = require('express');
var passport = require('passport');
var router = express.Router();
var path = require('path');


/**
 * Passport authentication routes
 */
router.get('/auth/google', passport.authenticate('google', {
    scope: 'profile'
}));


router.get('/oauth2callback', passport.authenticate('google', {
    failureRedirect: '/login'
}), function(req, res){
    // we're authenticated, let's go home
    res.redirect('/');
});


router.get('/auth/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// 404 anything in /static/ that wasn't found by express.static
router.get('/static/*', function(req, res){
    res.send(404);
});

// Everything else just forwards to the client app
router.get('/*', function(req, res){
  res.sendfile(path.join(__dirname, '../public/app/index.html'));
});

module.exports = router;
