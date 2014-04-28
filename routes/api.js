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
    }, 800);
});

/**
 * Players
 */

router.get('/players', function(req, res, next){
    db.Player.findAll({
        attributes: ['name', 'id'],
        order: 'id'
    }).success(function(players){
        res.send(200, _.pluck(players, 'values'));
    }).fail(function(err){
        next(err);
    });
});

router.post('/players', function(req, res, next){
    db.Player.create(req.body).success(function(player){
        res.send(201, player.values);
    }).fail(function(err){
        next(err);
    });
});

// find the player when we're passed a player ID
router.param('playerid', function(req, res, next, id){
    db.Player.find({
        where: {
            id: id
        },
        attributes: ['id', 'name']
    }).success(function(player){
        if(!player) return next({status: 404, message: 'Unable to find player'});
        req.player = player;
        next();
    }).fail(function(err){
        next(err);
    });
});

router.get('/players/:playerid', function(req, res){
    res.send(200, req.player.values);
});

router.put('/players/:playerid', function(req, res, next){
    var Player = req.player;
    Player.updateAttributes(req.body).success(function(player){
        res.send(200, player.values);
    }).fail(function(err){
        next(err);
    });
});

router.delete('/players/:playerid', function(req, res, next){
    req.player.destroy().success(function(){
        res.send(200);
    }).fail(function(err){
        next(err);
    })
});


/**
 * Users
 */

router.get('/users', function(req, res, next){
    db.User.findAll({
        //attributes: ['name', 'id', 'email']
    }).success(function(users){
        res.send(200, _.pluck(users, 'values'));
    }).fail(function(err){
        next(err);
    });
});

// disabled - users are created by passport
// router.post('/users', function(req, res, next){
//     db.User.create(req.body).success(function(user){
//         res.send(201, user.values);
//     }).fail(function(err){
//         next(err);
//     });
// });

router.get('/users/:userid', function(req, res, next){
    db.User.find({
        where: {
            id: req.params.userid
        },
        include: {
            model: db.Player,
            attributes: ['name', 'id']
        },
        attributes: ['name', 'id']
    }).success(function(user){
        res.send(user.values);
    }).fail(function(err){
        next(err);
    });
});

/**
 * Teams
 */

router.get('/teams', function(req, res, next){
    db.Team.findAll({
        attributes: ['name', 'id'],
        include: [{
            model: db.Player,
            attributes: ['name', 'id']
        }]
    }).success(function(teams){
        res.send(200, _.pluck(teams, 'values'));
    }).fail(function(err){
        next(err);
    });
});

router.get('/teams/:teamid', function(req, res, next){
    db.Team.find({
        where: {
            id: req.params.teamid
        },
        include: [{
            model: db.Player,
            attributes: ['name', 'id']
        }, {
            model: db.Stat

        }]
    }).success(function(team){
        if(!team) return res.send(404);
        res.send(200, team.values);
    }).fail(function(err){
        next(err);
    });
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

    db.helpers.getTeamByPlayers(safePlayers).then(function(team){
        if(!team) return res.send(404);
        res.send(200, team);

    }, function(err){
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

    // First check whether the team already exists
    db.helpers.getTeamIdByPlayers(playerIDs).then(function(teamId){
        if(teamId) throw {status:409, message:'Team exists: ' + teamId};

        // Now find the players
        return db.Player.findAll({
            where: {
                id: req.body.players
            }
        });

    }).then(function(players){
        if(!players || !players.length || players.length !== req.body.players.length) throw {status:400, message: 'Invalid player IDs'};

        // create the team
        return db.Team.create({
            name: req.body.name
        }).then(function(team){

            // add players and a stat model, return the team model
            return team.setPlayers(players).then(function(players){
                return db.Stat.create({}).then(function(stat){
                    return stat.setTeam(stat).then(function(){
                        res.send(200, team.values);
                    });
                });
            });
        });
    }).catch(function(err){
        next(err);
    });

});

router.delete('/teams/:teamid', function(req, res, next){
    db.Team.find({
        where: {
            id: req.params.teamid
        },
        include: [{
            model: db.Player,
            attributes: ['name', 'id']
        }, {
            model: db.Stat

        }]
    }).then(function(team){
        // todo - if the team doesn't exist, should we still try to destroy the other models?
        if(!team) return;
        return team.destroy();
    }).then(function(){
        // todo - do this in sequelize
        // nuke stats and playersteams records when you nuke a team

        return db.Stat.find({
            where: {
                TeamId: req.params.teamid
            }
        });
    }).then(function(stats){
        // todo - as above, if there are no stats, do we still continue on or throw?
        if(!stats) return;
        return stats.destroy();
    }).then(function(){
        // remove the playersteams models
        var teamid = Number(req.params.teamid);
        return db.sequelize.query('DELETE FROM "PlayersTeams" WHERE "PlayersTeams"."TeamId" = ' + teamid + ';');
    }).then(function(){
        res.send(200);
    }).catch(function(err){
        next(err);
    });

});


/**
 * Games
 */

router.get('/games', function(req, res, next){
    db.Game.findAll({
        include: [{
            model: db.Team,
            attributes: ['name']
        }]
    }).success(function(games){
        res.send(200, games);
    }).fail(function(err){
        console.log(err);
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
    db.Game.findAll({
        include: [{
            model: db.Team,
            attributes: ['name']
        }],
        where: Sequelize.or('"winningTeamId" IS NULL', '"losingTeamId" IS NULL')
    }).then(function(data){
        res.send(200, data);
    }).catch(function(err){
        next(err);
    });
});

router.get('/games/search/:teamids', function(req, res, next){
    if(!req.params.teamids) return res.send(400);

    var teamsString = _.map(req.params.teamids.split(','), function(team){
        return Number(team);
    }).join(',');

    db.sequelize.query('SELECT "Games".* FROM "Games" LEFT OUTER JOIN "GamesTeams" AS "Teams.GamesTeam" ON "Games"."id" = "Teams.GamesTeam"."GameId" LEFT OUTER JOIN "Teams" AS "Teams" ON "Teams"."id" = "Teams.GamesTeam"."TeamId" WHERE "Teams".id IN (' + teamsString + ') GROUP BY "Games".id  HAVING COUNT(*) = 2 ORDER BY "Games".id;').then(function(data){
        res.send(200, data);
    }).catch(function(err){
        next(err);
    });

});

router.post('/games', function(req, res, next){
    if(!req.body.teams || !req.body.teams.length) return res.send(400, 'No team IDs specified');

    db.Team.findAll({
        where: {
            id: req.body.teams
        }
    }).success(function(teams){
        if(!teams || !teams.length) return res.send(400, 'Invalid team IDs');

        console.log('found teams:');
        console.log(_.pluck(teams, 'values'));

        db.Game.create({}).success(function(game){
            game.setTeams(teams).success(function(gamesteam){
                res.send(200, game.values);
            }).fail(function(err){
                next(err);
            });
        }).fail(function(err){
            next(err);
        });
    });

});

router.put('/games/:gameid', function(req, res, next){
    // todo - this is crap. should tell them what's missing
    var params = _.pick(req.body, 'winner', 'loser', 'pants', 'redemption');
    if(_.size(params) !== 4) return next({status: 400, message: 'missing required parameters'});


    db.Game.find({
        where: {
            id: req.params.gameid
        },
        include: db.Team
    }).success(function(game){
        if(!game) return next({status:404});

        // game exists, ensure that .winner and .loser are the actual teams

        // ok, the game exists.
        var teams = _.pluck(game.values.teams, 'id');
        var winner = Number(req.body.winner);
        var loser = Number(req.body.loser);
        if(!~teams.indexOf(winner) || !~teams.indexOf(loser) || winner === loser) return next({status:400, message:'invalid values for winner/loser'});

        // alright, let's do it.
        game.updateAttributes({
            winningTeamId: winner,
            losingTeamId: loser,
            pants: req.body.pants,
            redemption: req.body.redemption
        }).success(function(game){
            res.send(200, game.values);
        }).fail(function(err){
            next(err);
        });

        // todo
        // need to update the stats tables too!

    }).fail(function(err){
        next(err);
    });

});


/**
 * User (current user)
 */

router.get('/user', function(req, res, next){
    console.log(req.user);
    res.send(200, req.user);
});


// 404 everything else
router.get('/*', function(req, res){
    res.send(404);
});

// XHR-friendly error handling middleware
router.use(function(err, req, res, next) {
    res.status(err.status || 500);
    if(err.message) return res.send({error: err.message});
    return res.send(err);
});


module.exports = router;
