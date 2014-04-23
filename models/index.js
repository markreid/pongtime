/**
 * models/index.js
 * configure and initialize our sequelize connection
 */

var config = require('../config');

var Sequelize = require('sequelize');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var sequelize = new Sequelize(config.DB.NAME, config.DB.USER, config.DB.PASS, {
    host: config.DB.HOST,
    port: config.DB.POST,
    dialect: config.DB.DIALECT
});


// attach the models
var models = {};
fs.readdirSync(__dirname).filter(function(file){
    return (file.indexOf('.') !== 0) && (file !== 'index.js' && file !== 'dbutils.js');
}).forEach(function(file){
    console.info('loading models from ' + file);
    var model = sequelize.import(path.join(__dirname, file));
    models[model.name] = model;
});

// configure associations
models.Player.hasOne(models.User);
models.User.belongsTo(models.Player);

models.Team.hasMany(models.Player);
models.Player.hasMany(models.Team);


_.each(models, function(model){
    if(model.associate) model.associate(models);
});

sequelize.sync();


// helper methods for tasks that we do over and over

var helpers = {
    getTeamByPlayers: function(playerIDs, callback){
        var playersString = playerIDs.join(',');

        sequelize.query('SELECT "TeamId" FROM "PlayersTeams" GROUP BY "TeamId" HAVING COUNT(*) = SUM(CASE WHEN "PlayerId" IN(' + playersString + ') THEN 1 ELSE 0 END) AND COUNT (*) = ' + playerIDs.length + ';').success(function(data){
            if(!data[0] || !data[0].TeamId) callback(null, null);

            models.Team.find({
                where: {
                    id: data[0].TeamId
                },
                include: models.Player
            }).success(function(team){
                callback(null, team);
            }).fail(function(err){
                callback(err);
            });

        }).fail(function(err){
            callback(err);
        });
    }
};

module.exports = _.extend({
    sequelize: sequelize,
    helpers: helpers
}, models);
