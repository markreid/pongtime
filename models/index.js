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
    dialect: config.DB.DIALECT,
    syncOnAssocation: true
});


// attach the models
// var models = {};
// fs.readdirSync(__dirname).filter(function(file){
//     return (file.indexOf('.') !== 0) && !~['index.js', 'dbutils.js', 'api.js'].indexOf(file);
// }).forEach(function(file){
//     console.info('loading models from ' + file);
//     var model = sequelize.import(path.join(__dirname, file));
//     models[model.name] = model;
// });

var sequelizeImport = function(filename){
    return sequelize.import(path.join(__dirname, filename));
};

var models = {
    User: sequelizeImport('user.js'),
    Game: sequelizeImport('game.js'),
    Team: sequelizeImport('team.js'),
    Stat: sequelizeImport('stats.js'),
    League: sequelizeImport('league.js')
};

_.each(models, function(model){
    if(model.associate) model.associate(models);
});

// set up our associations

// games have a winning team and a losing team
models.Team.hasMany(models.Game, {foreignKey: 'winningTeamId'});
models.Team.hasMany(models.Game, {foreignKey: 'losingTeamId'});

// games and teams are m2m
models.Team.hasMany(models.Game);
models.Game.hasMany(models.Team);


// teams have stats, and you can't delete the stats while they're referenced
models.Stat.hasOne(models.Team, {foreignKey: 'statId', onDelete:'RESTRICT', onUpdate:'CASCADE'});
models.Team.belongsTo(models.Stat, {foreignKey: 'statId'});

// games and teams both have a league
models.League.hasMany(models.Team, {foreignKey: 'leagueId'});
models.League.hasMany(models.Game, {foreignKey: 'leagueId'});

models.Team.belongsTo(models.League, {foreignKey: 'leagueId'});
models.Game.belongsTo(models.League, {foreignKey: 'leagueId'});

// create join tables for league moderators and league members: league <-> user m2m
models.LeagueModerators = sequelize.define('LeagueModerators', {});
models.LeagueMembers = sequelize.define('LeagueMembers', {});
models.League.hasMany(models.User, {as:'moderators', through: models.LeagueModerators});
models.User.hasMany(models.League, {as:'moderators', through: models.LeagueModeators});
models.League.hasMany(models.User, {as:'members', through: models.LeagueMembers});
models.User.hasMany(models.League, {as:'members', through: models.LeagueMembers});


// todo - this is an asynchronous task, it should have a success handler
sequelize.sync().then(function(){
    console.log('sequelize synced (force:false)');
});

module.exports = _.extend({
    sequelize: sequelize,
    api: require('./api')(sequelize, models)
}, models);
