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
    Comp: sequelizeImport('comp.js')
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
// models.Stat.hasOne(models.Team, {foreignKey: 'statId', onDelete:'RESTRICT', onUpdate:'CASCADE'});
// models.Team.belongsTo(models.Stat, {foreignKey: 'statId'});

// teams have many stats
// models.Stat.belongsTo(models.Team, {foreignKey: ''})

// Teams have many stats (for each comp), but stats only have one team and one comp
models.Team.hasMany(models.Stat);
// fucking sequelize makes this sound backwards
models.Team.hasOne(models.Stat);
models.Comp.hasOne(models.Stat);


// comps have games
models.Comp.hasMany(models.Game, {foreignKey: 'compId'});
models.Game.belongsTo(models.Comp, {foreignKey: 'compId'});

// comps and teams are m2m
models.Team.hasMany(models.Comp);
models.Comp.hasMany(models.Team);

// create join tables for comp moderators and comp members: comp <-> user m2m
models.CompModerators = sequelize.define('CompModerators', {});
models.CompMembers = sequelize.define('CompMembers', {});
models.Comp.hasMany(models.User, {as:'moderators', through: models.CompModerators});
models.User.hasMany(models.Comp, {as:'moderators', through: models.CompModeators});
models.Comp.hasMany(models.User, {as:'members', through: models.CompMembers});
models.User.hasMany(models.Comp, {as:'members', through: models.CompMembers});


// todo - this is an asynchronous task, it should have a success handler
sequelize.sync().then(function(){
    console.log('sequelize synced (force:false)');
});


module.exports = _.extend({
    sequelize: sequelize,
    api: require('./api')(sequelize, models)
}, models);
