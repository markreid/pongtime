/**
 * auth module
 *
 * handle auth with passport
 */

var passport = require('passport');
var passportGoogle = require('passport-google').Strategy;
var db = require('../models');
var _ = require('underscore');

passport.use(new passportGoogle({
    returnURL: 'http://localhost:2020/auth/google/return',
    realm: 'http://localhost:2020/'
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
