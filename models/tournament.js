/**
 * leagues
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var Tournament = sequelize.define('Tournament', {
        name: {
            type: datatypes.STRING,
            allowNull: false
        },
        complete: {
            type: datatypes.BOOLEAN,
            allowNull: false,
            default: false
        },
        leagueId: {
            type: datatypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        }
    });

    return Tournament;
};
