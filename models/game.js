/**
 * game model
 */

var Sequelize = require('sequelize');

module.exports = function(sequelize, datatypes){
    'use strict';

    var Game = sequelize.define('Game', {
        date: {
            type: datatypes.DATE,
            defaultValue: Sequelize.NOW
        },
        redemption: {
            type: datatypes.BOOLEAN
        },
        pants: {
            type: datatypes.BOOLEAN
        }
    });

    // fields added via association
    // teams m2m
    // winner 121
    // loser 121

    return Game;
};
