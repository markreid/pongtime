/**
 * API routes.
 */

var express = require('express');
var router = express.Router();
var _ = require('underscore');
var Sequelize = require('sequelize');

var db = require('../models');


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
        if(!player) return next(new Error('Unable to find player'));
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
        include: {
            model: db.Player,
            attributes: ['name', 'id']
        }
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
        include: {
            model: db.Player,
            attributes: ['name', 'id']
        }
    }).success(function(team){
        res.send(200, team.values);
    }).fail(function(err){
        next(err);
    });
});

/**
 * Search for a team by player IDs, comma-separated
 * /api/team/search/1,2
 * Returns only a team with ALL players and NOBODY ELSE.
 */
router.get('/teams/search/:players', function(req, res, next){
    // sanitization
    var players = req.params.players.split(',');
    var safePlayers = _.map(players, function(p){
        return Number(p);
    });

    db.helpers.getTeamByPlayers(safePlayers, function(err, team){
        if(err) return next(err);
        if(!team) return res.send(404);

        res.send(200, team);

    });

});

router.post('/teams', function(req, res, next){
    db.Player.findAll({
        where: {
            id: req.body.players
        }
    }).success(function(players){
        if(!players || !players.length) return res.send(404);

        console.log('found players:');
        console.log(_.pluck(players, 'values'));

        db.Team.create({
            name: req.body.name
        }).success(function(team){
            team.setPlayers(players).success(function(team){
                res.send(200, team.values);
            });
        });

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

module.exports = router;
