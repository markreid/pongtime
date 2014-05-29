/**
 * API routes.
 */

var express = require('express');
var router = express.Router();
var _ = require('underscore');
var Sequelize = require('sequelize');

var db = require('../models');

// middleware for simulating a slow API response time
router.use(function apiSlowdownMiddleware(req, res, next){
    setTimeout(function(){
        next();
    //}, Math.random()*700);
    }, 0);
});


/**
 * League middleware.
 * The last-viewed league is stashed in a cookie as a convenience.
 */
router.use(function leagueMiddleware(req, res, next){
    // short-circuit if it's already set
    if(req.cookies.ptLeagueId) return next();

    // otherwise we need to look up the leagues and get the first one we're allowed to look at
    db.api.leagues.findAll(Sequelize.or({
        public: true
    }, {
        id: req.user && req.user.visibleLeagues || []
    })).then(function(leagues){
        // no leagues available, set -1 so the client knows we're locked out
        if(!leagues.length){
            res.cookie('ptLeagueId', -1, {path: '/', secure:true});
            return next();
        }

        res.cookie('ptLeagueId', leagues[0].id, {path: '/'});
        next();
    });

});

// super hacky auth middleware - if you're not a registered user with auth 3, you can only GET
router.use(function(req, res, next){
    //if(req.method !== 'GET' && (!req.user || req.user.auth !== 3)) throw {status:403};
    next();
});


/**
 * Route parameter matching
 */

// Any route that has the :leagueId parameter will have the matching League model
// attached to the request as req.league
// If the user doesn't have permission to view that league or the league doesn't exist,
// the 404 will be caught here.
router.param('leagueId', function(req, res, next){
    db.api.leagues.findOne({
        id: req.params.leagueId
    }, true).then(function(league){
        if(!league) return next({status:404});
        // 404 if the user isn't allowed to see this league
        if(!isLeagueVisible(league.values, req.user)) return next({status:404});
        // 403 if this isn't a GET request and user doesn't have write permission
        if(req.method !== 'GET' && !isLeagueWritable(league.values, req.user)) return next({status:403});

        // otherwise attach the league to the request object
        req.league = league;
        next();
    }).catch(function(err){
        next(err);
    });
});

// Whenever we're giveen the :playerId parameter, find the matching player
// This parameter can't be used without the :leagueId parameter
router.param('playerId', function(req, res, next, id){
    if(!req.params.leagueId) throw new Error(':playerId route param used without :leagueId');
    db.api.players.findOne({
        id: req.params.playerId,
        leagueId: req.params.leagueId
    }, true).then(function(player){
        if(!player) return next({status:404});
        req.player = player;
        next();
    }).catch(function(err){
        next(err);
    });
});

// whenever a route has a teamdid parameter, put the team on the request
// This parameter can't be used without the :leagueId parameter
router.param('teamId', function(req, res, next){
    if(!req.params.leagueId) throw new Error(':teamId route param used without :leagueId');

    db.api.teams.findOne({
        id: req.params.teamId,
        leagueId: req.params.leagueId
    }, true).then(function(team){
        if(!team) return next({status:404});
        req.team = team;
        next();
    }).catch(function(err){
        next(err);
    });
});

/**
 * Get All Leagues
 */
router.get('/leagues', function(req, res, next){
    // ok, this filter is a bit of a bitch.
    // if you're not logged in, you can only see public leagues
    // if you are logged in, you can also see leagues you're a member or moderator of
    var filter;
    if(!req.user){
        filter = {
            public: true
        };
    } else {
        filter = Sequelize.or({
            public: true
        }, {
            'members.id': [req.user && req.user.id || null]
        }, {
            'moderators.id': [req.user && req.user.id || null]
        });
    }

    // but if you're admin, you see everything.
    if(req.user && req.user.isAdmin) filter = {};

    db.api.leagues.findAll(filter).then(function(leagues){
        res.send(200, leagues);
    }).catch(function(err){
        next(err);
    });
});

// League detail route, return the league's values.
// Errors are caught by the :leagueId param route.
router.get('/leagues/:leagueId', function(req, res, next){
    res.send(200, req.league.values);
});

// GET players list
router.get('/leagues/:leagueId/players', function(req, res, next){
    req.league.getPlayers().then(function(players){
        res.send(200, _.pluck(players, 'values'));
    }).catch(function(err){
        next(err);
    });
});

// POST new player
router.post('/leagues/:leagueId/players', function(req, res, next){
    // if the user doesn't have write access to the specified league, it's a 403.
    // todo - can we drop this?
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    var properties = _.extend({}, req.body);
    properties.leagueId = req.params.leagueId;
    db.api.players.create(properties).then(function(player){
        res.send(201, player);
    }).catch(function(err){
        next(err);
    });
});

// GET player detail
router.get('/leagues/:leagueId/players/:playerId', function(req, res, next){
    res.send(200, req.player.values);
});

// PUT player detail
router.put('/leagues/:leagueId/players/:playerId', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    var properties = _.extend({}, req.body);
    properties.leagueId = req.params.leagueId;
    db.api.generic.updateModel(req.player, properties).then(function(player){
        res.send(200, player.values);
    }).catch(function(err){
        next(err);
    });
});

router.delete('/leagues/:leagueId/players/:playerId', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    db.api.generic.destroyModel(req.player).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});




/**
 * Teams
 */

router.get('/leagues/:leagueId/teams', function(req, res, next){
    req.league.getTeams().then(function(teams){
        res.send(200, teams);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Create a team, given a name and player IDs
 */
router.post('/leagues/:leagueId/teams', function(req, res, next){
    // user needs write permission on the league
    // todo - could we put this into the league middleware?
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    var playerIds = _.map(req.body.players, function(player){
        return Number(player);
    });

    db.api.teams.create({
        leagueId: req.params.leagueId,
        name: req.body.name,
        playerIds: playerIds,
    }).then(function(team){
        res.send(200, team);
    }).catch(function(err){
        next(err);
    });

});


router.get('/leagues/:leagueId/teams/:teamId', function(req, res, next){
    res.send(200, req.team);
});

/**
 * Search for a team by player IDs, comma-separated
 * /api/team/search/1,2
 * Returns only a team with ALL players and NOBODY ELSE.
 * _Technically_ could return more than one.
 */
router.get('/leagues/:leagueId/teams/search/:players', function(req, res, next){
    // you can't get here unless you've got a valid leagueId
    // so I don't think we need any auth here
    // todo double check
    // actually i think that's wrong

    // sanitization
    var players = req.params.players.split(',');
    var safePlayers = _.map(players, function(p){
        return Number(p);
    });

    db.api.teams.getTeamByPlayers(safePlayers).then(function(team){
        if(!team) return res.send(404);
        res.send(200, team);

    }, function(err){
        next(err);
    });
});

/**
 * Return the game history for a team
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
router.get('/leagues/:leagueId/teams/:teamId/games', function(req, res, next){
    // todo use req.team here
    var filter = visibleOrPublicFilter(req);
    filter.id = req.params.id;

    db.api.teams.getTeamWithGames(filter).then(function(response){
        if(!response) return next({status:404});
        res.send(200, response.games);
    }).catch(function(err){
        next(err);
    });
});


router.delete('/leagues/:leagueId/teams/:teamId', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    // todo - can we drop this because the middleware catches it?
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    db.api.teams.delete(req.team).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});

router.put('/leagues/:leagueId/teams/:teamId', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.team.leagueId, req.user)) return next({status:403});

    // for now, the only change you can make to a team is its name
    if(!req.body.name) return res.send(400);

    db.api.generic.updateModel(req.team, {
        name: req.body.name
    }).then(function(player){
        res.send(200, player.values);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Games
 */

// fetch all
router.get('/leagues/:leagueId/games', function(req, res, next){
    var filter = visibleOrPublicFilter(req);

    db.api.games.findAll(filter).then(function(games){
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Fetch games where winningTeamId or losingTeamId were not registered
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
router.get('/leagues/:leagueId/games/open/', function(req, res, next){
    var filter = visibleOrPublicFilter(req);
    db.api.games.findAll(Sequelize.and(filter, Sequelize.or('"winningTeamId" IS NULL', '"losingTeamId" IS NULL'))).then(function(games){
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Return all games played by the given teams
 * Returns only games with *both* teams
 */
router.get('/leagues/:leagueId/games/search/:teamids', function(req, res, next){
    // todo - auth this

    if(!req.params.teamids) return res.send(400);

    var teamsArray = _.map(req.params.teamids.split(','), function(team){
        return Number(team);
    });

    db.api.games.findByTeams(teamsArray).then(function(games){
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });

});

router.post('/leagues/:leagueId/games', function(req, res, next){
    // if the user doesn't have write access to this league, it's a 403.
    var leagueId = getLeagueId(req);
    if(!leagueIsWritable(leagueId, req.user)) return next({status:403});

    if(!req.body.teamIds || !req.body.teamIds.length) return res.send(400, 'No team IDs specified');

    db.api.games.create({
        teamIds: req.body.teamIds,
        leagueId: leagueId
    }).then(function(game){
        res.send(201, game);
    }).catch(function(err){
        next(err);
    });

});

// when a gameid parameter is specified, attach the game to the request
router.param('gameId', function(req, res, next, id){
    var filter = visibleOrPublicFilter(req);
    filter.id = id;

    db.api.games.findOne(filter, true).then(function(game){
        if(!game) return next({status: 404});
        req.game = game;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/leagues/:leagueId/games/:gameId', function(req, res, next){
    // auth and errors are handled by 'gameid' param route above, so all we do here
    // is return the values.
    res.send(200, req.game.values);
});

router.put('/leagues/:leagueId/games/:gameId', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.game.leagueId, req.user)) return next({status:403});

    var validProperties = _.pick(req.body, ['winningTeamId', 'losingTeamId', 'redemption']);
    db.api.games.update(req.game, validProperties).then(function(game){
        res.send(200, game);
    }).catch(function(err){
        next(err);
    });

});

router.delete('/leagues/:leagueId/games/:gameId', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.game.leagueId, req.user)) return next({status:403});

    db.api.generic.destroyModel(req.game).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});



/**
 * Leagues
 */



router.post('/leagues', function(req, res, next){
    // must be logged in and admin
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.leagues.create(req.body).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
});

router.put('/leagues/:leagueId', function(req, res, next){
    // 403 if you don't have permission
    if(!leagueIsWritable(req.params.leagueid, req.user)) return next({status:403});

    db.api.leagues.update(req.params.leagueid, req.body).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
});

// trigger stats refresh for a league
// todo - this should be authed, rate limited or even restricted to
// internal calls, because it's DB heavy and shouldn't be spammed.
router.get('/leagues/:leagueId/stats/refresh', function(req, res, next){
    // admin only for now
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.stats.refreshLeagueStats(req.params.leagueid).then(function(result){
        res.send(200, result);
    }).catch(function(err){
        next(err);
    });
});





/**
 * Users
 */

// currently logged in user
router.get('/user', function(req, res, next){
    res.send(200, req.user || null);
});

router.get('/users', function(req, res, next){
    db.api.users.findAll().then(function(users){
        res.send(200, users);
    }).catch(function(err){
        next(err);
    });
});

// if we're given a userid param, attach the user to the request
// note - we attach as .foundUser because .user is the currently logged in user.
router.param('userid', function(req, res, next, id){
    db.api.users.findOne({
        id: id
    }, true).then(function(user){
        req.foundUser = user;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/users/:userid', function(req, res, next){
    res.send(200, req.foundUser.values);
});


router.delete('/users/:userid', function(req, res, next){
    // only admins can delete users
    if(!req.user || !req.user.isAdmin) return next({status:403});

    req.foundUser.destroy().then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});




// 404 everything else
router.get('/*', function(req, res){
    res.send(404);
});

// XHR-friendly error handling middleware
router.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err);
    if(err.stack) console.error(err.stack);
    if(err.message) return res.send({error: err.message});
    return res.send(err);
});





/**
 * Returns whether a player can see a league
 * @param  {Object}  league  League model values
 * @param  {Object}  user    User model values
 * @return {Boolean}         visibility
 */
function isLeagueVisible(league, user){
    // league is public, everybody can see it
    if(league.public === true) return true;

    // not public, not logged in, you can't see it.
    if(!user) return false;

    // user is an admin, they can see it
    if(user.isAdmin) return true;

    // current user is a member, they can see it.
    var leagueMembers = _.pluck(league.members, 'id');
    if(~leagueMembers.indexOf(user.id)) return true;

    // league isn't public, user isn't admin, isn't a member. can't see it.
    return false;
}

function isLeagueWritable(league, user){
    if(!user) return false;
    // you are an admin
    if(user.isAdmin === true) return true;
    // you are a mod
    var leagueMods = _.pluck(league.moderators, 'id');
    if(~leagueMods.indexOf(user.id)) return true;
    // you are a member and modsAreMembers is true
    if(league.modsAreMembers === false) return false;
    var leagueMembers = _.pluck(league.members, 'id');
    if(~leagueMembers.indexOf(user.id)) return true;


    return false;
}

/**
 * Returns a Sequelize WHERE filter specifying that if the requested league
 * isn't visible to the user, the league must be public.
 * @param  {Express.Request} req
 * @return {Object}             WHERE filter
 */
function visibleOrPublicFilter(req){
    var leagueId = getLeagueId(req);
    var filter = {
        leagueId: leagueId
    };
    if(!leagueIsVisible(leagueId, req.user)){
        filter['League.public'] = true;
    }
    return filter;
}





module.exports = router;
