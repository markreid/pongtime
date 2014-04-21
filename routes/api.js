/**
 * API routes.
 */

var express = require('express');
var router = express.Router();
var _ = require('underscore');

var db = require('../models');



router.get('/players', function(req, res){
    db.Player.findAll({attributes:['name', 'id']}).success(function(players){
        res.send(200, _.pluck(players, 'values'));
    }).fail(function(err){
        res.send(500, err);
    });
});

router.post('/players', function(req, res, next){
    console.log(req.body);
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


// 404 everything else
router.get('/*', function(req, res){
    res.send(404);
});

module.exports = router;
