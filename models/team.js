/**
 * teams
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var Team = sequelize.define('Team', {
        name: {
            type: datatypes.STRING
        }
    });

    return Team;
};
