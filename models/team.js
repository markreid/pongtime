/**
 * teams
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var Team = sequelize.define('Team', {
        name: {
            type: datatypes.STRING
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

    return Team;
};
