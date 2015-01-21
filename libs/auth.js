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


/**
 * Google authentication
 */
passport.use(new passportGoogle({
    returnURL: config.AUTH.GOOGLE.RETURNURL,
    realm: config.AUTH.GOOGLE.REALM
}, function googleAuthCallback(identifier, profile, done){

    // Try and find a matching user
    db.User.find({
        where: {
            googleIdentifier: identifier
        },
        include: [{
            model: db.Comp,
            as: 'moderators'
        }, {
            model: db.Comp,
            as: 'members'
        }]
    }).then(function(user){

        // User exists. Parse the model into something more friendly and return.
        // todo - needs to be moved to deserializeUser because if any of this changes we don't realise
        // until they've logged out and in again.  Could cache and flag for invalidation to minimize DB hits.
        if(user){

            // We store comp details and permissions here.
            // So we want a list of comp IDs that the user is allowed to look at,
            // and a list of comp IDs that the user has permission to modify.
            var returnData = _.extend({}, user.values);

            // var moderatorOf = _.pluck(returnData.moderators, 'id');
            // var memberOf = _.pluck(returnData.members, 'id');
            // var memberModeratorOf = _.pluck(_.where(returnData.members, {membersAreMods: true}), 'id');

            // returnData.visibleComps = _.unique(memberOf.concat(moderatorOf));
            // returnData.writeableComps = _.unique(moderatorOf.concat(memberModeratorOf));
            returnData.isAdmin = user.values.auth === 3;
            return done(null, returnData);
        }

        // User doesn't exist, creat tehm.
        return db.User.create({
            googleIdentifier: identifier,
            email: profile.emails[0].value,
            name: profile.displayName
        }).then(function(user){
            return done(null, user.values);
        });

    }).catch(function(err){
        done(err);
    });

}));

passport.serializeUser(function(user, done){
    done(null, user);
});

/**
 * Take the UID stored in the session and deserialize a user from it
 * For now we're actually storing the whole user object in the session
 * Which saves DB requests, but means if the user gets updated we won't know
 * until they log out and in again.
 * @param  {Object}   user
 * @param  {Function} done  callback
 */
passport.deserializeUser(function(user, done){
    done(null, user);
});
