/**
 * API routes.
 */

var express = require('express');
var router = express.Router();
var _ = require('underscore');

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
