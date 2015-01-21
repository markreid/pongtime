/**
 * comps
 */

module.exports = function(sequelize, datatypes){
    'use strict';

    var Comp = sequelize.define('Comp', {
        name: {
            type: datatypes.STRING,
            allowNull: false
        },
        'public': {
            type: datatypes.BOOLEAN,
            allowNull: false,
            default: true
        },
        membersAreMods: {
            type: datatypes.BOOLEAN,
            allowNull: true,
            default: false
        }
    });

    return Comp;
};
