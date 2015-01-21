/**
 * stats model
 */

var Sequelize = require('sequelize');

module.exports = function(sequelize, datatypes){
    'use strict';

    var Stat = sequelize.define('Stat', {
        games: {
            type: datatypes.INTEGER,
            defaultValue: 0
        },
        wins: {
            type: datatypes.INTEGER,
            defaultValue: 0
        },
        losses: {
            type: datatypes.INTEGER,
            defaultValue: 0
        },
        hottest: {
            type: datatypes.INTEGER,
            defaultValue: 0
        },
        hottestEnd: {
            type: datatypes.DATE
        },
        coldest: {
            type: datatypes.INTEGER,
            defaultValue: 0
        },
        coldestEnd: {
            type: datatypes.DATE,
        },
        streak: {
            type: datatypes.INTEGER,
            defaultValue: 0
        }
    });

    return Stat;
};
