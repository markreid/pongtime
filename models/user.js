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

    return User;
};
