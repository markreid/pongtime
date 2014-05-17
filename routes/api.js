/**
 * API routes.
 */

var express = require('express');
var router = express.Router();
var _ = require('underscore');
var Sequelize = require('sequelize');

var db = require('../models');

// middleware for simulating a slow API response time
router.use(function(req, res, next){
    setTimeout(function(){
        next();
    }, 0);
});

// if you're not a registered user with auth 3, you can only GET
router.use(function(req, res, next){
    if(req.method !== 'GET' && (!req.user || req.user.auth !== 3)) throw {status:403};
    next();
});

/**
 * Players
 */

router.get('/players', function(req, res, next){
    db.api.players.findAll().then(function(players){
        res.send(200, players);
    }).catch(function(err){
        next(err);
    });
});

router.post('/players', function(req, res, next){
    db.api.players.create(req.body).then(function(player){
        res.send(201, player);
    }).catch(function(err){
        next(err);
    });
});

// Whenever we're given the playerid parameter, add the player
// to the request.
router.param('playerid', function(req, res, next, id){
    db.api.players.findOne({
        id: id
    }, true).then(function(player){
        if(!player) return next({status:404, message: 'Unable to find player'});
        req.player = player;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/players/:playerid', function(req, res, next){
    res.send(200, req.player.values);
});

router.get('/players/:playerid/stats', function(req, res, next){
    db.api.players.getStats(req.player).then(function(response){
        res.send(200, response);
    }).catch(function(err){
        next(err);
    });
});

router.put('/players/:playerid', function(req, res, next){
    db.api.generic.updateModel(req.player, req.body).then(function(player){
        res.send(200, player.values);
    }).catch(function(err){
        next(err);
    });
});

router.delete('/players/:playerid', function(req, res, next){
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

// if we're given a userid param, try to attach the user to the request
router.param('userid', function(req, res, next, id){
    db.api.users.findOne({
        id: id
    }).then(function(user){
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
    db.api.teams.findAll().then(function(teams){
        res.send(200, teams);
    }).catch(function(err){
        next(err);
    });
});

// whenever a route has a teamdid parameter, put the team on the request
router.param('teamid', function(req, res, next, id){
    db.api.teams.findOne({
        id: id
    }, true).then(function(team){
        if(!team) return next({status:404, message: 'Unable to find team'});
        req.team = team;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/teams/:teamid', function(req, res, next){
    res.send(200, req.team);
});

/**
 * Search for a team by player IDs, comma-separated
 * /api/team/search/1,2
 * Returns only a team with ALL players and NOBODY ELSE.
 * _Technically_ could return more than one.
 */
router.get('/teams/search/:players', function(req, res, next){

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

// trigger a stats regeneration
// todo - auth this or rate limit or something, it's heavy
router.get('/stats/refresh', function(req, res, next){
    db.api.stats.refreshAll(function(){

    });
    res.send(200);
});

/**
 * Return the game history for a team
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
router.get('/teams/:id/games', function(req, res, next){
    db.api.teams.getTeamWithGames(req.params.id).then(function(response){
        res.send(200, response.games);
    }).catch(function(err){
        next(err);
    });
});

/**
 * Create a team, given a name and player IDs
 */
router.post('/teams', function(req, res, next){
    var playerIDs = _.map(req.body.players, function(player){
        return Number(player);
    });

    db.api.teams.create(req.body.name, playerIDs).then(function(team){
        res.send(200, team);
    }).catch(function(err){
        next(err);
    });

});

router.delete('/teams/:teamid', function(req, res, next){
    db.api.teams.delete(req.team).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});

router.put('/teams/:teamid', function(req, res, next){
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
    db.api.games.findAll().then(function(games){
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
    db.api.games.findAll(Sequelize.or('"winningTeamId" IS NULL', '"losingTeamId" IS NULL')).then(function(games){
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
    if(!req.body.teams || !req.body.teams.length) return res.send(400, 'No team IDs specified');

    db.api.games.create(req.body.teams).then(function(game){
        res.send(201, game);
    }).catch(function(err){
        next(err);
    });

});

// when a gameid parameter is specified, attach the game to the request
router.param('gameid', function(req, res, next, id){
    db.api.games.findOne({
        id: id
    }, true).then(function(game){
        if(!game) throw {status: 404, message: 'Game not found'};
        req.game = game;
        next();
    }).catch(function(err){
        next(err);
    });
});

router.get('/games/:gameid', function(req, res, next){
    res.send(200, req.game.values);
});

router.put('/games/:gameid', function(req, res, next){
    // todo - only submit the relevant data to the db method

    db.api.games.update(req.game, req.body).then(function(game){
        res.send(200, game);
    }).catch(function(err){
        next(err);
    });

});

router.delete('/games/:gameid', function(req, res, next){
    db.api.generic.destroyModel(req.game).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });
});



/**
 * Leagues
 */

router.get('/leagues', function(req, res, next){
    db.api.leagues.findAll().then(function(leagues){
        if(req.session.activeLeagueId){
            leagues = _.map(leagues, function(league){
                if(league.id === req.session.activeLeagueId){
                    league.active = true;
                }
                return league;
            });
        } else {
            console.log(leagues);
            if(leagues.length) leagues[0].active = true;
        }
        res.send(200, leagues);
    }).catch(function(err){
        next(err);
    });
});

router.post('/leagues', function(req, res, next){
    db.api.leagues.create(req.body).then(function(league){
        res.send(200, league);
    }).catch(function(err){
        next(err);
    });
});

router.put('/leagues/:leagueid', function(req, res, next){
    db.api.leagues.update(req.params.leagueid, req.body).then(function(league){
        res.send(200, league);
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


module.exports = router;
