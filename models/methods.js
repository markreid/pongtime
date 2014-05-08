var _ = require('underscore');

module.exports = function(sequelize, models){
    'use strict';

    var methods = {
        players: {},
        teams: {},
        stats: {},
        games: {},
        generic: {}
    };

    /**
     * Update a model with a set of attributes
     * @param  {Sequelize.Model} model
     * @param  {Object} attributes
     * @return {Sequelize.Model}
     */
    methods.generic.updateModel = function(model, attributes){
        return model.updateAttributes(attributes).then(function(model){
            return model;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Destroy a model
     * @param  {Sequelize.Model} model
     * @return {Boolean}    success
     */
    methods.generic.destroyModel = function(model){
        return model.destroy().then(function(){
            return true;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Record a win for a team
     * @param {Number} teamId
     * @param {Object} extras   extra data to be recorded (pants, redemption, etc)
     */
    methods.stats.addWin = function(teamId, extras){
        return models.Stat.find({
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

            if(extras && extras.redemption) stat.redemptionsGiven++;

            return stat.save().then(function(stat){
                return stat.values;
            });
        });
    };

    /**
     * Record a loss for a team
     * @param {Number} teamId
     * @param {Object} extras   extra data (redemption, etc)
     */
    methods.stats.addLoss = function(teamId, extras){
        return models.Stat.find({
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

            if(extras && extras.redemption) stat.redemptionsHad++;

            return stat.save().then(function(stat){
                return stat.values;
            });
        });

    };

    /**
     * Find all players
     * @return {Object}     model.values
     */
    methods.players.findAll = function(where){
        return models.Player.findAll({
            where: where || {},
            attributes: ['name', 'id'],
            order: 'id'
        }).then(function(players){
            return _.pluck(players, 'values');
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find a single player,
     * @param  {Object} where   filter data
     * @param  {Boolean} notValues  set true to pass the model, not the values
     * @return {Object}         model.values
     */
    methods.players.findOne = function(where, notValues){
        return models.Player.find({
            where: where || {},
            attributes : ['id', 'name']
        }).then(function(player){
            // if notValues is true, we want to return the model
            if(notValues) return player || null;
            return player && player.values || null;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Create a player
     * @param  {Object} data
     * @return {Object}      model.values
     */
    methods.players.create = function(data){
        // todo - validation here
        return models.Player.create(data).then(function(player){
            return player.values;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find all teams
     * @param  {Object} where   filter params
     * @return {Object}         model.values
     */
    methods.teams.findAll = function(where){
        return models.Team.findAll({
            where: where || {},
            attributes: ['name', 'id'],
            include: [{
                model: models.Player,
                attributes: ['name', 'id']
            }]
        }).then(function(teams){
            return _.pluck(teams, 'values');
        }).catch(function(err){
            throw err;
        });
    };

    methods.teams.findOne = function(where, notValues){
        return models.Team.find({
            where: where || {},
            include: [{
                model: models.Player,
                attributes: ['name', 'id']
            }]
        }).then(function(team){
            if(notValues) return team || null;
            return team && team.values || null;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Fetch a team ID by searching for its players
     * @param  {Array} playerIDs
     * @return {Number}
     */
    methods.teams.getTeamIdByPlayers = function(playerIDs){
        var playersString = playerIDs.join(',');
        return sequelize.query('SELECT "TeamId" FROM "PlayersTeams" GROUP BY "TeamId" HAVING COUNT(*) = SUM(CASE WHEN "PlayerId" IN(' + playersString + ') THEN 1 ELSE 0 END) AND COUNT (*) = ' + playerIDs.length + ';').then(function(data){
            if(data && data.length) return data[0].TeamId;
            return null;
        });
    };

    /**
     * Fetch a team by searching for its players
     * @param  {Array} playerIDs
     * @return {Object}     team
     */
    methods.teams.getTeamByPlayers = function(playerIDs){
        return methods.teams.getTeamIdByPlayers(playerIDs).then(function(teamId){
            if(!teamId) return null;
            return models.Team.find({
                where: {
                    id: teamId
                },
                include: [models.Player, models.Stat]
            }).then(function(team){
                return team.values;
            });
        });
    };

    /**
     * Create a new team, given a name and player IDs
     * @param  {String} name
     * @param {Array} playerIDs
     * @return {Object}
     */
    methods.teams.create = function(name, playerIDs){
        if(!name || !playerIDs) throw {status:409, message: 'teams.create() requires 2 arguments'};
        // First we need to ensure a team doesn't exist with these players
        return methods.teams.getTeamIdByPlayers(playerIDs).then(function(teamId){
            if(teamId) throw {status:409, message: 'Team exists: ' + teamId};

            // now get the players
            return methods.players.findAll({
                id: playerIDs
            });
        }).then(function(players){
            if(!players || !players.length || players.length !== playerIDs.length) throw {status:400, message: 'Invalid player IDs'};

            // add the team to the DB
            return models.Team.create({
                name: name
            }).then(function(team){

                // ok it gets a bit crazy here because we need to
                // refer to team, players and stat, all via closure

                // now associate the players
                return team.setPlayers(players).then(function(players){
                    // add a Stat model
                    return models.Stat.create({}).then(function(stat){
                        // associate the team with the stat
                        return stat.setTeam(team).then(function(){
                            return team.values;
                        });
                    });
                });
            });
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Delete a team and its associated entities
     * @param  {Sequelize.model} model
     * @return {Boolean}
     */
    methods.teams.delete = function(model){
        var teamId = Number(model.values.id);

        // todo - this can probably be handled by the ORM
        // but for now it's done manually.
        // When a team is removed, we need to remove its
        // associated playersteams records and its stats model
        return model.destroy().then(function(){
            // todo - this can be a single query
            // intead of finding and then deleting
            return models.Stat.find({
                where: {
                    TeamId: teamId
                }
            });
        }).then(function(stat){
            if(!stat) return;
            return stat.destroy();
        }).then(function(){
            // remove the playersteams models
            return sequelize.query('DELETE FROM "PlayersTeams" WHERE "PlayersTeams"."TeamId" = ' + teamId + ';');
        }).then(function(){
            return true;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find all games, optionally filtered
     * @param  {Object} where
     * @return {Array}
     */
    methods.games.findAll = function(where){
        return models.Game.findAll({
            where: where || {},
            include: [{
                model: models.Team,
                attributes: ['name']
            }]
        }).then(function(games){
            return _.pluck(games, 'values');
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find a single game, optionally filtered
     * @param  {Object} where     filters
     * @param  {Boolean} notValues return the model instead of model.values
     * @return {Object}
     */
    methods.games.findOne = function(where, notValues){
        return models.Game.find({
            where: where || {},
            include: [{
                model: models.Team,
                attributes: ['name']
            }]
        }).then(function(game){
            if(!game) throw {status:404, message: 'Game not found'};
            return game;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Return an array of games matching the provided team IDs
     * @param  {Array} teamIds
     * @return {Array}
     */
    methods.games.findByTeams = function(teamIds){
        if(!teamIds instanceof Array) throw new Error('teamIds must be an array');
        var teamsString = teamIds.join(',');
        return sequelize.query('SELECT "Games".* FROM "Games" LEFT OUTER JOIN "GamesTeams" AS "Teams.GamesTeam" ON "Games"."id" = "Teams.GamesTeam"."GameId" LEFT OUTER JOIN "Teams" AS "Teams" ON "Teams"."id" = "Teams.GamesTeam"."TeamId" WHERE "Teams".id IN (' + teamsString + ') GROUP BY "Games".id  HAVING COUNT(*) = 2 ORDER BY "Games".id;').then(function(games){
            return games;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Create a game
     * @param  {Array} teamIds  array of team IDs
     * @return {Object}         game
     */
    methods.games.create = function(teamIds){
        return methods.teams.findAll({id: teamIds}).then(function(teams){
            if(!teams || teams.length !== 2) throw new Error('Invalid team IDs');

            return models.Game.create({}).then(function(game){
                return game.setTeams(teams).then(function(gamesteam){
                    return game;
                });
            });
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Update a game
     * @param  {[type]} gameData [description]
     * @return {[type]}          [description]
     */
    methods.games.update = function(model, gameData){

        // to update a game, we need winner, loser, redemption.
        var requiredFields = ['winner', 'loser', 'redemption'];
        var missingFields = _.difference(requiredFields, Object.keys(gameData));
        if(missingFields.length) throw new Error ('games.update() missing arguments: ' + missingFields.join(', '));

        // are the teams we've been given actually valid for this game?
        var teams = _.map(model.values.teams, function(team){
            return team.dataValues.id;
        });
        if(!~teams.indexOf(gameData.winner) || !~teams.indexOf(gameData.loser) || gameData.winner === gameData.loser) throw new Error('invalid winner and loser team IDs');

        // was there previously a result set for this game?
        var hadResult = model.values.winningTeamId || model.values.losingTeamId;

        // ok, arguments are all valid, let's update the game.
        return model.updateAttributes({
            winningTeamId: gameData.winner,
            losingTeamId: gameData.loser,
            redemption: gameData.redemption
        }).then(function(game){

            // if there was previously a result set for this game
            // and we're editing it, we need to refresh the stats
            // for the teams and players involved.
            if(hadResult){
                // trigger a stats refresh here
                return;
            }

            // otherwise, we're adding a result for the first time, so
            // we can just call the .addWin and .addLoss stats helpers.
            return methods.stats.addWin(gameData.winner, {
                redemption: gameData.redemption
            }).then(function(){
                return methods.stats.addLoss(gameData.loser, {
                    redemption: gameData.redemption
                });
            });

        }).catch(function(err){
            throw err;
        });

    };

    return methods;

};
