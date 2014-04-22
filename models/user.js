/**
 * User model
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var User = sequelize.define('User', {
        name: {
            type: datatypes.STRING,
            allowNull: false
        },
        email: {
            type: datatypes.STRING,
            allowNull: false,
            unique: true
        },
        auth: {
            type: datatypes.INTEGER,
            defaultValue: 0
        },
        googleIdentifier: {
            type: datatypes.STRING,
            allowNull: false,
            unique: true
        }
    });

    // User has a .player property which is a 1to1 on Player
    // it gets set up in models/index.js

    return User;
};
