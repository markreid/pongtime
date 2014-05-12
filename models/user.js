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
        },
        playerId: {
            type: datatypes.INTEGER,
            references: 'Players',
            referencesKey: 'id',
            // if the player gets deleted, set this to null
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        }
    });

    return User;
};
