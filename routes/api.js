/**
 * API routes.
 */
'use strict';

var express = require('express');
var router = express.Router();
var _ = require('underscore');
var Sequelize = require('sequelize');

var db = require('../models');



/**
 * Middleware
 */


// Can be used in dev environment for simulating slow API responses
router.use(function apiSlowdownMiddleware(req, res, next){
    setTimeout(function(){
        next();
    //}, Math.random()*700);
    }, 0);
});


/**
 * Route params
 */

/**
 * Most routes use the :leagueId parameter
 * We attach the League model to the request as req.league
 *
 * We also handle authentication here.
 * Leagues not visible to the current user will throw a 404.
 * Requests other than GET to a league the user can't write to throw a 403.
 */
router.param('leagueId', function(req, res, next){
    db.api.leagues.findOne({
        id: req.params.leagueId
    }, true).then(function(league){
        // 404
        if(!league) return next({status:404});

        // 404 if the user isn't allowed to see this league
        if(!isLeagueVisible(league.values, req.user)) return next({status:404});

        // 403 if this isn't a GET request and user doesn't have write permission
        if(req.method !== 'GET' && !isLeagueWritable(league.values, req.user)) return next({status:403});

        // otherwise attach the league to the request object and continue
        req.league = league;
        next();
    }).catch(function(err){
        next(err);
    });
});

/**
 * :playerId route handler, attach .player to req
 */
router.param('playerId', function(req, res, next, id){
    if(!req.params.leagueId) throw new Error(':playerId route param used without :leagueId');

    req.league.getPlayers({
        where: {
            id: req.params.playerId
        }
    }).then(function(players){
        if(!players || !players.length) return next({status:404});
        req.player = players[0];
        next();
    }).catch(function(err){
        next(err);
    });
});

/**
 * :teamId route handler, attach .team to req
 */
router.param('teamId', function(req, res, next){
    if(!req.params.leagueId) throw new Error(':teamId route param used without :leagueId');

    req.league.getTeams({
        where: {
            id: req.params.teamId
        }
    }).then(function(teams){
        if(!teams || !teams.length) return next({status:404});
        req.team = teams[0];
        next();
    }).catch(function(err){
        next(err);
    });

});

/**
 * :gameId route handler, attach .game to req
 */
router.param('gameId', function(req, res, next){
    if(!req.params.leagueId) throw new Error(':teamId route param used without :leagueId');

    // can't use league.getGames because it gets confused by:
    // error: column reference "leagueId" is ambiguous
    db.api.games.findOne({
        leagueId: req.league.id,
        id: req.params.gameId
    }, true).then(function(game){
        if(!game) next({status:404});
        req.game = game;
        next();
    }).catch(function(err){
        next(err);
    });

});

router.param('tournamentId', function(req, res, next){
    if(!req.params.leagueId) throw new Error(':leagueId route param used without :leagueId');

    db.api.tournaments.findOne({
        leagueId: req.league.id,
        id: req.params.tournamentId
    }, true).then(function(tournament){
        if(!tournament) return next({status:404});
        req.tournament = tournament;
        next();
    }).catch(function(err){
        next(err);
    });
});




/**
 * API routes
 */


router.route('/leagues')
.get(function(req, res, next){
    /**
     * If you're not logged in, you can only see public leagues
     * Otherwise you can see public leagues + leagues you're a member or moderator of.
     */
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

    // Admins can see all leagues
    if(req.user && req.user.isAdmin) filter = {};

    db.api.leagues.findAll(filter).then(function(leagues){
        res.send(200, leagues);
    }).catch(function(err){
        next(err);
    });
}).post(function(req, res, next){
    // must be logged in and admin
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.leagues.create(req.body).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
});

// League detail
// req.league is set by the :leagueId parameter
router.route('/leagues/:leagueId')
.get(function(req, res, next){
    // todo - this queries twice
    // because we already have the league in req.league
    db.api.leagues.findOneDetailed({
        id: req.league.id
    }).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
}).put(function(req, res, next){
    // auth is handled by the :leagueId parameter middleware
    db.api.leagues.update(req.params.leagueId, req.body).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
}).delete(function(req, res, next){
    // todo - should this be admin only?
    req.league.destroy().then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });

});

/**
 * Player list
 */
router.route('/leagues/:leagueId/players')
.get(function(req, res, next){
    req.league.getPlayers({
        include: [{
            model: db.Stat
        }]
    }).then(function(players){
        res.send(200, _.pluck(players, 'values'));
    }).catch(function(err){
        next(err);
    });
}).post(function(req, res, next){
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

/**
 * Player detail
 */
router.route('/leagues/:leagueId/players/:playerId')
.get(function(req, res, next){
    res.send(200, req.player.values);
}).put(function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    var properties = _.extend({}, req.body);
    properties.leagueId = req.params.leagueId;
    db.api.generic.updateModel(req.player, properties).then(function(player){
        res.send(200, player.values);
    }).catch(function(err){
        next(err);
    });
}).delete(function(req, res, next){
    // 403 if the user doesn't have write permission on this league
    if(!isLeagueWritable(req.league, req.user)) return next({status:403});

    db.api.generic.destroyModel(req.player).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Player detail with stats
 */
router.get('/leagues/:leagueId/players/:playerId/stats', function(req, res, next){
    req.player.getStat().then(function(stats){
        if(!stats) return next({status:404});
        var returnData = _.extend({}, req.player.values);
        returnData.stat = stats.values;
        res.send(200, returnData);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Player detail with all associated models (stats, teams)
 */
router.get('/leagues/:leagueId/players/:thePlayerId/all', function(req, res, next){
    db.api.players.findOneDetailed({
        leagueId: req.league.id,
        id: req.params.thePlayerId
    }).then(function(player){
        if(!player) return next({status:404});
        res.send(200, player);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Teams list
 */
router.route('/leagues/:leagueId/teams')
.get(function(req, res, next){
    req.league.getTeams({
        include: [{
            model: db.Stat
        }]
    }).then(function(teams){
        res.send(200, teams);
    }).catch(function(err){
        next(err);
    });

}).post(function(req, res, next){

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


/**
 * Team detail
 */
router.route('/leagues/:leagueId/teams/:teamId')
.get(function(req, res, next){
    res.send(200, req.team.values);

}).put(function(req, res, next){

    // for now, the only change you can make to a team is its name
    if(!req.body.name) return res.send(400);

    db.api.generic.updateModel(req.team, {
        name: req.body.name
    }).then(function(player){
        res.send(200, player.values);
    }).catch(function(err){
        next(err);
    });

}).delete(function(req, res, next){
    db.api.teams.delete(req.team).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });

});

router.get('/leagues/:leagueId/teams/:theTeamId/all', function(req, res, next){
    db.api.teams.findOneDetailed({
        leagueId: req.params.leagueId,
        id: req.params.theTeamId,
    }).then(function(team){
        if(!team) next({status:404});
        res.send(200, team);
    }).catch(function(err){
        next(err);
    });

});

/**
 * Search for a team by player IDs
 * Only returns a team with the exact players
 * pass player Ids as comma separated numbers - /search/2,3,4/
 */
router.get('/leagues/:leagueId/teams/search/:playerIds', function(req, res, next){

    // clean up player IDs
    var players = req.params.playerIds.split(',');
    var safePlayers = _.map(players, function(p){
        return Number(p);
    });

    // this api method will ignore the leagueId, so we need to double check
    // what we're given back to to ensure it matches the league.
    db.api.teams.getTeamByPlayers(safePlayers).then(function(team){
        if(!team) return next({status:404});
        // needs to belong to the league that we're looking at
        if(team.leagueId !== Number(req.params.leagueId)) return next({status:404});
        res.send(200, team);

    }, function(err){
        next(err);
    });
});

/**
 * Get games associated with a team
 */
router.get('/leagues/:leagueId/teams/:teamId/games', function(req, res, next){
    req.team.getGames().then(function(games){
        if(!games) return next({status:404});
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });
});


/**
 * Games list
 */
router.route('/leagues/:leagueId/games')
.get(function(req, res, next){
    req.league.getGames({
        include: [{
            model: db.Team,
            attributes: ['name', 'id']
        }]
    }).then(function(games){
        res.send(200, _.pluck(games, 'values'));
    }).catch(function(err){
        next(err);
    });

}).post(function(req, res, next){

    if(!req.body.teamIds || !req.body.teamIds.length) return res.send(400, 'No team IDs specified');

    db.api.games.create({
        teamIds: req.body.teamIds,
        leagueId: req.league.id
    }).then(function(game){
        res.send(201, game);
    }).catch(function(err){
        next(err);
    });

})

/**
 * Find games with no recorded result
 */
router.get('/leagues/:leagueId/games/open', function(req, res, next){
    db.api.games.findAll(Sequelize.and({
        leagueId: req.params.leagueId
    }, Sequelize.or('"winningTeamId" IS NULL', '"losingTeamId" IS NULL'))).then(function(games){
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Return all games played between two specific teams
 */
router.get('/leagues/:leagueId/games/search/:teamIds', function(req, res, next){
    var teamIds = _.map(req.params.teamIds.split(','), function(team){
        return Number(team);
    });

    // this api call ignores the leagueId so we need to check what
    // we get returned
    db.api.games.findByTeams(teamIds).then(function(games){
        var gamesFromThisLeague = _.where(games, {leagueId:Number(req.params.leagueId)});
        res.send(200, gamesFromThisLeague);
    }).catch(function(err){
        next(err);
    });

});

/**
 * Game detail
 * Read/write permissions handled by :leagueId param middleware
 */
router.route('/leagues/:leagueId/games/:gameId').get(function(req, res, next){
    res.send(200, req.game.values);

}).put(function(req, res, next){

    var validProperties = _.pick(req.body, ['winningTeamId', 'losingTeamId', 'redemption', 'date', 'tournamentId']);
    db.api.games.update(req.game, validProperties).then(function(game){
        res.send(200, game);
    }).catch(function(err){
        next(err);
    });

}).delete(function(req, res, next){

    db.api.generic.destroyModel(req.game).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });

});


router.route('/leagues/:leagueId/tournaments')
.get(function(req, res, next){
    db.api.tournaments.findAll({}).then(function(tournaments){
        res.send(200, tournaments);
    }).catch(function(err){
        next(err);
    });

})
.post(function(req, res, next){
    var validProperties = _.pick(req.body, ['name', 'complete']);
    validProperties.leagueId = req.params.leagueId;
    db.api.tournaments.create(validProperties).then(function(tournament){
        res.send(201, tournament);
    }).catch(function(err){
        next(err);
    });

});

router.route('/leagues/:leagueId/tournaments/:tournamentId')
.get(function(req, res, next){
    res.send(200, req.tournament);

}).delete(function(req, res, next){
    db.api.tournaments.delete(req.tournament).then(function(deleted){
        // todo - is this supposed to be a 201?
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});

router.route('/leagues/:leagueId/tournaments/:tournamentId/games').get(function(req, res, next){
    req.tournament.getGames().then(function(games){
        var gameValues = _.pluck(games, 'values');
        res.send(200, gameValues);
    }).catch(function(err){
        next(err);
    });
});


/**
 * Force a stats refresh for a league
 * Currently authed to admin-only because it's a bit DB heavy
 * todo - rate limit perhaps?
 */
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
 * User routes
 */


/**
 * Get logged in user
 */
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

/**
 * Handle userId parameter
 * Note: we use .foundUser because .user is the current logged-in user, attached by Passport
 */
router.param('userId', function(req, res, next, id){
    db.api.users.findOne({
        id: id
    }, true).then(function(user){
        req.foundUser = user;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.route('/users/:userId')
.get(function(req, res, next){
    res.send(200, req.foundUser.values);

}).delete(function(req, res, next){

    // only admins can delete users
    if(!req.user || !req.user.isAdmin) return next({status:403});

    req.foundUser.destroy().then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });

});




/**
 * Anything not caught above is a 404.
 */
router.get('/*', function(req, res){
    res.send(404);
});

/**
 * Make errors a bit more friendly for XHR
 */
router.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err);
    if(err.stack) console.error(err.stack);
    if(err.message) return res.send({error: err.message});
    return res.send(err);
});





/**
 * Helpers
 */


/**
 * Is the given league visible to this user?
 * @param  {Model}  league
 * @param  {Object}  user
 * @return {Boolean}
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

    // current user is a moderator, they can see it.
    var leagueModerators = _.pluck(league.moderators, 'id');
    if(~leagueModerators.indexOf(user.id)) return true;

    // league isn't public, user isn't admin, isn't a member. can't see it.
    return false;
}

/**
 * Is the given league writable by this user?
 * @param  {Model}  league
 * @param  {Object}  user
 * @return {Boolean}
 */
function isLeagueWritable(league, user){
    // you're not logged in
    if(!user) return false;

    // you are an admin
    if(user.isAdmin === true) return true;

    // you are a mod of the league
    var leagueMods = _.pluck(league.moderators, 'id');
    if(~leagueMods.indexOf(user.id)) return true;

    // you are a member of the league and modsAreMembers is true
    if(league.modsAreMembers === false) return false;
    var leagueMembers = _.pluck(league.members, 'id');
    if(~leagueMembers.indexOf(user.id)) return true;

    // default is no
    return false;
}


module.exports = router;
