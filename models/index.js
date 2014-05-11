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
    return (file.indexOf('.') !== 0) && !~['index.js', 'dbutils.js', 'methods.js'].indexOf(file);
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

models.Game.hasMany(models.Team);
models.Team.hasMany(models.Game);

models.Team.hasOne(models.Game, {foreignKey: 'winningTeamId', as: 'Winner'});
models.Team.hasOne(models.Game, {foreignKey: 'losingTeamId', as: 'Loser'});

models.Team.hasOne(models.Stat);
models.Player.hasOne(models.Stat);
//models.Stat.belongsTo(models.Team);


_.each(models, function(model){
    if(model.associate) model.associate(models);
});

// todo - this is an asynchronous task, it should have a success handler
sequelize.sync();

module.exports = _.extend({
    sequelize: sequelize,
    methods: require('./methods')(sequelize, models)
}, models);
