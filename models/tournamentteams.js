/**
 * tournament-teams through-table
 * joins Tournament and Team in an m2m
 * and we add on tournamentStatId which references a Stat
 * so teams can have a stat row for a specific tournament.
 */

module.exports = function(sequelize, datatypes){
    'use strict';



    var TournamentTeam = sequelize.define('TournamentTeam', {
        statId: {
            type: datatypes.INTEGER,
            references: 'Stats',
            referencesKey: 'id'
        },
        TeamId: {
            type: datatypes.INTEGER,
            references: 'Teams',
            referencesKey: 'id',
            allowNull: false,
            // if the team gets deleted, we delete this too
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        TournamentId: {
            type: datatypes.INTEGER,
            references: 'Tournaments',
            referencesKey: 'id',
            allowNull: false,
            // if the tournament gets deleted, this gets deleted too
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    });

    return TournamentTeam;
};
