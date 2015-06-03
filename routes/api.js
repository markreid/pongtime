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
 * Most routes use the :compId parameter
 * We attach the Comp model to the request as req.comp
 *
 * We also handle authentication here.
 * Comps not visible to the current user will throw a 404.
 * Requests other than GET to a comp the user can't write to throw a 403.
 */
router.param('compId', function(req, res, next){
    db.api.comps.findOne({
        id: req.params.compId
    }, true).then(function(comp){
        // 404
        if(!comp) return next({status:404});

        // 404 if the user isn't allowed to see this comp
        if(!isCompVisible(comp.values, req.user)) return next({status:404});

        // 403 if this isn't a GET request and user doesn't have write permission
        if(req.method !== 'GET' && !isCompWritable(comp.values, req.user)) return next({status:403});

        // otherwise attach the comp to the request object and continue
        req.comp = comp;
        next();
    }).catch(function(err){
        next(err);
    });
});

/**
 * :playerId route handler, attach .player to req
 */
router.param('playerId', function(req, res, next, id){
    if(!req.params.compId) throw new Error(':playerId route param used without :compId');

    req.comp.getPlayers({
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
    if(!req.params.compId) throw new Error(':teamId route param used without :compId');

    req.comp.getTeams({
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
router.param('gameId', function(req, res, next, id){
    if(!req.params.compId) throw new Error(':teamId route param used without :compId');

    // can't use comp.getGames because it gets confused by:
    // error: column reference "compId" is ambiguous
    db.api.games.findOne({
        compId: req.comp.id,
        id: req.params.gameId
    }, true).then(function(game){
        if(!game) next({status:404});
        req.game = game;
        next();
    }).catch(function(err){
        next(err);
    });

});




/**
 * API routes
 */


router.route('/comps')
.get(function(req, res, next){
    /**
     * If you're not logged in, you can only see public comps
     * Otherwise you can see public comps + comps you're a member or moderator of.
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

    // Admins can see all comps
    if(req.user && req.user.isAdmin) filter = {};

    db.api.comps.findAll(filter).then(function(comps){
        res.send(200, comps);
    }).catch(function(err){
        next(err);
    });
}).post(function(req, res, next){
    // must be logged in and admin
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.comps.create(req.body).then(function(comp){
        res.send(200, comp);
    }).catch(function(err){
        next(err);
    });
});

// Comp detail
// req.comp is set by the :compId parameter
router.route('/comps/:compId')
.get(function(req, res, next){
    res.send(200, req.comp);
    // findOneDetailed() is disabled for now because it thrashes the shit out of system memory
    // by asking for everything associated with a comp in one hit
    // todo - configure the clientside to do it all in several requests and pass the work
    // off to the client.
    // db.api.comps.findOneDetailed({
    //     id: req.comp.id
    // }).then(function(comp){
    //     res.send(200, comp);
    // }).catch(function(err){
    //     next(err);
    // });
}).put(function(req, res, next){
    // auth is handled by the :compId parameter middleware
    db.api.comps.update(req.params.compId, req.body).then(function(comp){
        res.send(200, comp);
    }).catch(function(err){
        next(err);
    });
}).delete(function(req, res, next){
    // todo - should this be admin only?
    req.comp.destroy().then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });

});

/**
 * Teams list
 */

router.route('/teams')
.get(function(req, res, next){
    db.api.teams.findAll().then(function(teams){
        res.send(200, teams);
    }).catch(function(err){
        next(err);
    });
}).post(function(req, res, next){

    db.api.teams.create({
        name: req.body.name
    }).then(function(team){
        res.send(200, team);
    }).catch(function(err){
        next(err);
    });

});


/**
 * Comp teams
 */
router.route('/comps/:compId/teams')
.get(function(req, res, next){
    /**
     * List the teams in a comp
     */

    req.comp.getTeams({
        include: [db.Stat]
    }).then(function(teams){
        res.send(200, teams);
    }).catch(function(err){
        next(err);
    });

}).post(function(req, res, next){
    /**
     * Add a team to a comp
     */

    db.api.teams.findOne(req.body.id, true).then(function(teamObject){
        return req.comp.addTeam(teamObject);
    }).then(function(associatedTeams){
        res.send(200);
    }).catch(function(err){
        throw err;
    });

}).delete(function(req, res, next){
    /**
     * Remove a team from a comp
     */

    db.api.teams.findOne(req.body.id, true).then(function(teamObject){
        return req.comp.removeTeam(teamObject);
    }).then(function(){
        res.send(200);
    }).catch(function(err){
        throw err;
    });
});


/**
 * Team detail
 */
router.route('/comps/:compId/teams/:teamId')
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

router.get('/comps/:compId/teams/:theTeamId/all', function(req, res, next){
    db.api.teams.findOneDetailed({
        compId: req.params.compId,
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
router.get('/comps/:compId/teams/search/:playerIds', function(req, res, next){

    // clean up player IDs
    var players = req.params.playerIds.split(',');
    var safePlayers = _.map(players, function(p){
        return Number(p);
    });

    // this api method will ignore the compId, so we need to double check
    // what we're given back to to ensure it matches the comp.
    db.api.teams.getTeamByPlayers(safePlayers).then(function(team){
        if(!team) return next({status:404});
        // needs to belong to the comp that we're looking at
        if(team.compId !== Number(req.params.compId)) return next({status:404});
        res.send(200, team);

    }, function(err){
        next(err);
    });
});

/**
 * Get games associated with a team
 */
router.get('/comps/:compId/teams/:teamId/games', function(req, res, next){
    // todo - why doesn't this work?
    // req.team.getGames({
    //     include: [{
    //         model: db.Team,
    //         attributes: ['name', 'id']
    //     }]
    // })

    db.api.teams.getTeamGames(req.params.teamId).then(function(games){
        if(!games) return next({status:404});
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });
});


/**
 * Games list
 */
router.route('/comps/:compId/games')
.get(function(req, res, next){
    req.comp.getGames({
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
        compId: req.comp.id
    }).then(function(game){
        res.send(201, game);
    }).catch(function(err){
        next(err);
    });

})

/**
 * Find games with no recorded result
 */
router.get('/comps/:compId/games/open', function(req, res, next){
    db.api.games.findAll(Sequelize.and({
        compId: req.params.compId
    }, Sequelize.or('"winningTeamId" IS NULL', '"losingTeamId" IS NULL'))).then(function(games){
        res.send(200, games);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Return all games played between two specific teams
 */
router.get('/comps/:compId/games/search/:teamIds', function(req, res, next){
    var teamIds = _.map(req.params.teamIds.split(','), function(team){
        return Number(team);
    });

    // this api call ignores the compId so we need to check what
    // we get returned
    db.api.games.findByTeams(teamIds).then(function(games){
        var gamesFromThisComp = _.where(games, {compId:Number(req.params.compId)});
        res.send(200, gamesFromThisComp);
    }).catch(function(err){
        next(err);
    });

});

/**
 * Game detail
 * Read/write permissions handled by :compId param middleware
 */
router.route('/comps/:compId/games/:gameId').get(function(req, res, next){
    res.send(200, req.game.values);

}).put(function(req, res, next){

    var validProperties = _.pick(req.body, ['winningTeamId', 'losingTeamId', 'date']);
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



/**
 * Force a stats refresh for a comp
 * Currently authed to admin-only because it's a bit DB heavy
 * todo - rate limit perhaps?
 */
router.get('/comps/:compId/stats/refresh', function(req, res, next){
    // admin only for now
    if(!req.user || !req.user.isAdmin) return next({status:403});

    db.api.stats.refreshCompStats(req.params.compId).then(function(result){
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
 * Is the given comp visible to this user?
 * @param  {Model}  comp
 * @param  {Object}  user
 * @return {Boolean}
 */
function isCompVisible(comp, user){
    // comp is public, everybody can see it
    if(comp.public === true) return true;

    // not public, not logged in, you can't see it.
    if(!user) return false;

    // user is an admin, they can see it
    if(user.isAdmin) return true;

    // current user is a member, they can see it.
    var compMembers = _.pluck(comp.members, 'id');
    if(~compMembers.indexOf(user.id)) return true;

    // current user is a moderator, they can see it.
    var compModerators = _.pluck(comp.moderators, 'id');
    if(~compModerators.indexOf(user.id)) return true;

    // comp isn't public, user isn't admin, isn't a member. can't see it.
    return false;
}

/**
 * Is the given comp writable by this user?
 * @param  {Model}  comp
 * @param  {Object}  user
 * @return {Boolean}
 */
function isCompWritable(comp, user){
    // you're not logged in
    if(!user) return false;

    // you are an admin
    if(user.isAdmin === true) return true;

    // you are a mod of the comp
    var compMods = _.pluck(comp.moderators, 'id');
    if(~compMods.indexOf(user.id)) return true;

    // you are a member of the comp and modsAreMembers is true
    if(comp.modsAreMembers === false) return false;
    var compMembers = _.pluck(comp.members, 'id');
    if(~compMembers.indexOf(user.id)) return true;

    // default is no
    return false;
}


module.exports = router;
