/**
 * Player model
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var Player = sequelize.define('Player', {
        name: {
            type: datatypes.STRING,
            allowNull: false
        },
        statId: {
            type: datatypes.INTEGER,
            references: 'Stats',
            referencesKey: 'id'
        },
        leagueId: {
            type: datatypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        }
    });

    return Player;
};
