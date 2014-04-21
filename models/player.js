/**
 * Player model
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var Player = sequelize.define('Player', {
        name: {
            type: datatypes.STRING,
            allowNull: false
        }
    });

    return Player;
};
