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
        slug: {
            type: datatypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: ['^[a-z\-]+$', 'i'],
            }
        },
        statId: {
            type: datatypes.INTEGER,
            references: 'Stats',
            referencesKey: 'id'
        },
        leagueId: {
            type: datatypes.INTEGER,
            references: 'Leagues',
            referncesKey: 'id',
            allowNull: false
        }
    });

    return Player;
};
