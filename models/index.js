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

models.Game.hasMany(models.Team);
models.Team.hasMany(models.Game);

models.Team.hasOne(models.Game, {foreignKey: 'winningTeamId', as: 'Winner'});
models.Team.hasOne(models.Game, {foreignKey: 'losingTeamId', as: 'Loser'});

models.Team.hasOne(models.Stat);
models.Stat.belongsTo(models.Team);


_.each(models, function(model){
    if(model.associate) model.associate(models);
});

sequelize.sync();


// helper methods for tasks that we do over and over

var getTeamIdByPlayers = function(playerIDs){
    var playersString = playerIDs.join(',');
    return sequelize.query('SELECT "TeamId" FROM "PlayersTeams" GROUP BY "TeamId" HAVING COUNT(*) = SUM(CASE WHEN "PlayerId" IN(' + playersString + ') THEN 1 ELSE 0 END) AND COUNT (*) = ' + playerIDs.length + ';').then(function(data){
        if(data && data.length) return data[0].TeamId;
        return null;
    });
};

var getTeamByPlayers = function(playerIDs){
    return getTeamIdByPlayers(playerIDs).then(function(teamId){
        if(!teamId) return null;

        return models.Team.find({
            where: {
                id: teamId
            },
            include: [models.Player, models.Stat]
        });
    });
};



// record a win in a team's stats model
var addStatsWin = function(teamId, redemption){
    return db.Stat.find({
        where: {
            TeamId: teamId
        }
    }).then(function(stat){
        if(!stat) throw new Error('Unable to find Stat model for Team ' + teamId);

        // increment games and wins
        stat.games++;
        stat.wins++;

        if(stat.streak >= 0){
            // we're on a hot streak, increment the streak
            stat.streak++;

            // if this is the hottest streak, increment it and remove the end date
            if(stat.streak > stat.hottest){
                stat.hottest = stat.streak;
                stat.hottestDate = null;
            }

        } else {
            // ending a cold streak
            // if it's the coldest, set the date to today
            if(stat.streak === stat.coldest) stat.coldestEnd = new Date();

            // reset to 1
            stat.streak = 1;
        }

        if(redemption) stat.redemptionsGiven++;

        return stat.save();
    });
};

// record a loss in a team's stats model
var addStatsLoss = function(teamId, redemption){
    return db.Stat.find({
        where: {
            TeamId: teamId
        }
    }).then(function(stat){
        if(!stat) throw new Error('Unable to find Stat model for Team ' + teamId);

        // increment games and losses
        stat.games++;
        stat.losses++;

        if(stat.streak >= 0){
            // we're on a hot streak, break it.
            // if this is the hottest, set the end date to today
            if(stat.streak === stat.hottest) stat.hottestEnd = new Date();

            // reset streak to -1
            stat.streak = -1;
        } else {
            // continuing a cold streak. bummerrrrrr.
            stat.streak--;
            // if this is the coldest streak, decrement it and remove the end date
            if(stat.streak < stat.coldest){
                stat.coldest = stat.streak;
                stat.coldestEnd = null;
            }
        }

        if(redemption) stat.redemptionsHad++;

        return stat.save();
    });
};

// record a draw in a team's stats model
var addStatsDraw = function(teamId){

};

var helpers = {
    getTeamIdByPlayers: getTeamIdByPlayers,
    getTeamByPlayers: getTeamByPlayers,
    addStatsDraw: addStatsDraw,
    addStatsWin: addStatsWin,
    addStatsLoss: addStatsLoss
};

module.exports = _.extend({
    sequelize: sequelize,
    helpers: helpers
}, models);
