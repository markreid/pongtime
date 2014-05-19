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
        meta: {
            type: datatypes.TEXT
        },
        winningTeamId: {
            type: datatypes.INTEGER,
            references: 'Teams',
            referencesKey: 'id',
            // if the team gets deleted, delete this too
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        losingTeamId: {
            type: datatypes.INTEGER,
            references: 'Teams',
            referencesKey: 'id',
            // if the team gets deleted, delete this too
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        leagueId: {
            type: datatypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        }
    });

    return Game;
};
