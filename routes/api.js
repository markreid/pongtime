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
 * Players
 */

router.get('/players', function(req, res, next){
    var filter = visibleOrPublicFilter(req);

    db.api.players.findAll(filter).then(function(players){
        res.send(200, players);
    }).catch(function(err){
        next(err);
    });
});


router.post('/players', function(req, res, next){
    // if the user doesn't have write access to the specified league, it's a 403.
    if(!leagueIsWritable(req.body.leagueId, req.user)) return next({status:403});

    db.api.players.create(req.body).then(function(player){
        res.send(201, player);
    }).catch(function(err){
        next(err);
    });
});

// Whenever we're given the playerid parameter, add the player to the request
router.param('playerid', function(req, res, next, id){
    var filter = visibleOrPublicFilter(req);
    filter.id = req.params.playerid;

    db.api.players.findOne(filter, true).then(function(player){
        if(!player) return next({status:404});
        req.player = player;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/players/:playerid', function(req, res, next){
    // auth and errors are handled by the param route above, so all we need to do here
    // is return the values.
    res.send(200, req.player.values);
});

router.put('/players/:playerid', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.player.leagueId, req.user)) return next({status:403});

    db.api.generic.updateModel(req.player, req.body).then(function(player){
        res.send(200, player.values);
    }).catch(function(err){
        next(err);
    });
});

router.delete('/players/:playerid', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.player.leagueId, req.user)) return next({status:403});

    db.api.generic.destroyModel(req.player).then(function(){
        res.send(200);
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

/**
 * Teams
 */

router.get('/teams', function(req, res, next){
    // league must be public or visible to the current user
    var filter = visibleOrPublicFilter(req);

    db.api.teams.findAll(filter).then(function(teams){
        res.send(200, teams);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Create a team, given a name and player IDs
 */
router.post('/teams', function(req, res, next){
    // user needs write permission on the league
    var leagueId = Number(req.body.leagueId);
    if(!leagueIsWritable(leagueId, req.user)) return next({status:403});

    var playerIds = _.map(req.body.players, function(player){
        return Number(player);
    });

    db.api.teams.create({
        leagueId: leagueId,
        name: req.body.name,
        playerIds: playerIds,
    }).then(function(team){
        res.send(200, team);
    }).catch(function(err){
        next(err);
    });

});

// whenever a route has a teamdid parameter, put the team on the request
router.param('teamid', function(req, res, next, id){
    var filter = visibleOrPublicFilter(req);
    filter.id = req.params.teamid;

    db.api.teams.findOne(filter, true).then(function(team){
        if(!team) return next({status:404});
        req.team = team;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/teams/:teamid', function(req, res, next){
    // auth and errors handled by the 'teamid' param route, so all we need to do here
    // is return the values.
    res.send(200, req.team);
});

/**
 * Search for a team by player IDs, comma-separated
 * /api/team/search/1,2
 * Returns only a team with ALL players and NOBODY ELSE.
 * _Technically_ could return more than one.
 */
router.get('/teams/search/:players', function(req, res, next){
    // todo - how to auth this?

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
router.get('/teams/:id/games', function(req, res, next){
    var filter = visibleOrPublicFilter(req);
    filter.id = req.params.id;

    db.api.teams.getTeamWithGames(filter).then(function(response){
        if(!response) return next({status:404});
        res.send(200, response.games);
    }).catch(function(err){
        next(err);
    });
});


router.delete('/teams/:teamid', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.team.leagueId, req.user)) return next({status:403});

    db.api.teams.delete(req.team).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});

router.put('/teams/:teamid', function(req, res, next){
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
router.get('/games', function(req, res, next){
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
router.get('/games/open/', function(req, res, next){
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
router.get('/games/search/:teamids', function(req, res, next){
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

router.post('/games', function(req, res, next){
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
router.param('gameid', function(req, res, next, id){
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

router.get('/games/:gameid', function(req, res, next){
    // auth and errors are handled by 'gameid' param route above, so all we do here
    // is return the values.
    res.send(200, req.game.values);
});

router.put('/games/:gameid', function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!leagueIsWritable(req.game.leagueId, req.user)) return next({status:403});

    var validProperties = _.pick(req.body, ['winningTeamId', 'losingTeamId', 'redemption']);
    db.api.games.update(req.game, validProperties).then(function(game){
        res.send(200, game);
    }).catch(function(err){
        next(err);
    });

});

router.delete('/games/:gameid', function(req, res, next){
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

/**
 * Get Leagues
 */
router.get('/leagues', function(req, res, next){
    // You can only see public leagues, or leagues that you're a member/moderator of.
    var filter = Sequelize.or({
        public: true
    }, {
        id: req.user && req.user.visibleLeagues || []
    });
    // unless you're an admin, then you can see everything.
    if(req.user && req.user.isAdmin) filter = {};

    db.api.leagues.findAll(filter).then(function(leagues){
        res.send(200, leagues);
    }).catch(function(err){
        next(err);
    });
});

router.get('/leagues/:leagueid', function(req, res, next){
    // only leagues that are public or you're allowed to see
    var filter = Sequelize.and({
        id: req.params.leagueid
    }, Sequelize.or({
        public: true,
    }, {
        id: req.user && req.user.visibleLeagues || []
    }));

    // admins see all
    if(req.user && req.user.isAdmin) filter = {
        id: req.params.leagueid
    };

    db.api.leagues.findOneDetailed(filter).then(function(league){
        if(!league) return res.send(404);
        res.send(league, 200);
    }).catch(function(err){
        next(err);
    });
})

router.post('/leagues', function(req, res, next){
    // must be logged in and admin
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.leagues.create(req.body).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
});

router.put('/leagues/:leagueid', function(req, res, next){
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
router.get('/leagues/:leagueid/stats/refresh', function(req, res, next){
    // admin only for now
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.stats.refreshLeagueStats(req.params.leagueid).then(function(result){
        res.send(200, result);
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
 * Return the leagueId the user is searching for
 * Look at req.query, fall back to cookie value
 * @param  {Express Request} req
 * @return {Number}
 */
function getLeagueId(req){
    return Number(req.query.league) || Number(req.cookies.ptLeagueId) || -1;
}


/**
 * Return whether a league is visible to the current user
 * This doesn't take league.public into account! Just whether they have permission.
 * @param  {Number} leagueId
 * @param  {Object} user
 * @return {Boolean}
 */
function leagueIsVisible(leagueId, user){
    if(!user) return false;
    if(user.isAdmin) return true;

    leagueId = Number(leagueId);
    return !!~user.visibleLeagues.indexOf(leagueId);
}

/**
 * Return whether a league is writeable to the current user
 * @param  {Number} leagueId
 * @param  {Object} user
 * @return {Boolean}
 */
function leagueIsWritable(leagueId, user){
    if(!user) return false;
    if(user.isAdmin) return true;

    leagueId = Number(leagueId);
    return !!~user.writeableLeagues.indexOf(leagueId);
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
