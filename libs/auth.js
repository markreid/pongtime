/**
 * auth module
 *
 * handle auth with passport
 */

var passport = require('passport');
var passportGoogle = require('passport-google').Strategy;
var db = require('../models');
var _ = require('underscore');
var config = require('../config');

passport.use(new passportGoogle({
    returnURL: config.AUTH.GOOGLE.RETURNURL,
    realm: config.AUTH.GOOGLE.REALM
}, function googleAuthCallback(identifier, profile, done){

    // login as an existing user or register a new one
    db.User.findOrCreate({
        googleIdentifier: identifier
    }, {
        email: profile.emails[0].value,
        name: profile.displayName
    }).success(function(user, created){
        if(created) console.log('Created user ' + user.id);
        done(null, user.values);
    }).fail(function(err){
        done(err);
    });
}));

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
    // db.User.find({
    //     where: {
    //         email: id.value
    //     }
    // }).success(function(user){
    //     done(null, user.values);
    // }).fail(function(err){
    //     done(err);
    // });
});
