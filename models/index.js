/**
 * models/index.js
 * configure and initialize our sequelize connection
 */

var config = require('../config')

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
    if(model.associate) model.associate(models);
});

// configure associations
models.User.hasOne(models.Player);

sequelize.sync();

module.exports = _.extend({
    sequelize: sequelize
}, models);
