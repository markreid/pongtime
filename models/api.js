var _ = require('underscore');
var Sequelize = require('sequelize');
var Q = require('q');

module.exports = function(sequelize, models){
    'use strict';

    var api = {
        teams: {},
        stats: {},
        games: {},
        users: {},
        comps: {},
        generic: {}
    };

    /**
     * Update a model with a set of attributes
     * @param  {Sequelize.Model} model
     * @param  {Object} attributes
     * @return {Sequelize.Model}
     */
    api.generic.updateModel = function(model, attributes){
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
    api.generic.destroyModel = function(model){
        return model.destroy().then(function(){
            return true;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Update stat values with a win for a team
     * @param {Object} gameData     game model values
     */
    api.teams.recordWin = function(gameData){
        return models.Team.find({
            where: {
                id: gameData.winningTeamId
            },
            include: [{
                model: models.Stat
            }]
        }).then(function(team){
            if(!team.stat) throw new Error('Unable to find stat model for team ' + team.values.id);

            var updatedStats = addWinToStats(team.stat.values, gameData);

            return team.stat.updateAttributes(updatedStats);
        });
    };

    /**
     * Record a loss for a team
     * @param {Object} gameData
     */
    api.teams.recordLoss = function(gameData){
        return models.Team.find({
            where: {
                id: gameData.losingTeamId
            },
            include: [{
                model: models.Stat
            }]
        }).then(function(team){
            if(!team.stat) throw new Error('Unable to find stat model for team ' + team.values.id);

            var updatedStats = addLossToStats(team.stat.values, gameData);
            return team.stat.updateAttributes(updatedStats);
        });
    };

    api.stats.findByTeam = function(teamId, notValues){
        return models.Stat.find({
            include: [{
                model: models.Team,
                where: {
                    statId: teamId
                }
            }]
        }).then(function(stat){
            if(!stat) return null;
            if(notValues) return stat;
            return stat.values;
        }).catch(function(err){
            throw err;
        });
    };



    /**
     * Find all teams
     * @param  {Object} where   filter params
     * @return {Object}         model.values
     */
    api.teams.findAll = function(where, notValues){
        return models.Team.findAll({
            where: where || {},
            //attributes: ['name', 'id'],
            include: [{
                model: models.Stat
            }]
        }).then(function(teams){
            if(notValues) return teams;
            return _.pluck(teams, 'values');
        }).catch(function(err){
            throw err;
        });
    };

    api.teams.findOneDetailed = function(where, notValues){
        return models.Team.find({
            where: where || {},
            include: [{
                model: models.Stat
            }]
        }).then(function(team){
            if(notValues) return team || null;
            return team && team.values || null;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Get the games relating to a single team
     * @param  {Number} teamId
     * @return {Array}
     */
    api.teams.getTeamGames = function(teamId){
        // easiest way is to grab the team, but only return the games.
        return models.Team.find({
            where: {
                id: teamId
            },
            include: [{
                model: models.Game,
                include: [{
                    model: models.Team,
                    attributes: ['name', 'id']
                }]
            }]
        }).then(function(team){
            if(!team) return null;
            return team.values.games;
        }).catch(function(err){
            throw err;
        });
    };



    /**
     * Regenerates all the stats for a comp.
     * @param {Number} compId
     * @returns {Promise} DB operations promise
     */
    api.stats.refreshCompStats = function(compId){
        if(!compId) throw new Error('.refreshCompStats() called without a valid compId');

        // We fetch every single game that's been played in the comp, ordering chronologically.

        return api.games.findAll({
            compId: compId
        }).then(function(games){
            console.log('stats.refreshCompStats() found ' + games.length + ' games to process.');

            // Generate a fresh Stat model, which we use as a template, and create an object to hold
            // the team stats models.
            var cleanStats = models.Stat.build({}).values;
            var teamStats = {};

            // Iterate through the games, checking the winningTeamId and losingTeamId.
            // If this is the first time we've seen this team, clone cleanStats and put it in teamStats, referenced by ID.
            // Otherwise, update the existing object in teamStats.
            _.each(games, function(game){

                // no winner or loser, game hasn't been saved.
                if(!game.winningTeamId || !game.losingTeamId) return;

                teamStats[game.winningTeamId] = addWinToStats(teamStats[game.winningTeamId] || _.extend({}, cleanStats), game);
                teamStats[game.losingTeamId] = addLossToStats(teamStats[game.losingTeamId] || _.extend({}, cleanStats), game);

            });

            // We now have regenerated Stat models for every team in the comp.
            // So we need to overwrite the DB Stats with our new values.

            var teamIds = Object.keys(teamStats);
            var teamOperations = [];

            // Fetch all the relevant teams from the DB, and call updateAttributes on each of them,
            // pushing the call into our teamOperations array.
            return api.teams.findAll({
                id: teamIds
            }, true).then(function(teams){
                _.each(teams, function(team){
                    teamOperations.push(team.stat.updateAttributes(teamStats[team.id]));
                });
            }).then(function(){
                // teamOperations is an array full of promises for DB operations.
                // Wrap it with Q.all so we can fire a response when they have all finished updating.
                return Q.all(teamOperations);

            }).then(function(){
                console.log('refreshed stats table for comp ' + compId);
                return true;
            }).catch(function(err){
                throw err;
            });

        });

    };

    /**
     * Find a team and all its game data
     */
    api.teams.getTeamWithGames = function(where, notValues){
        return models.Team.find({
            where: where,
            include: [{
                model: models.Game
            }]
        }).then(function(team){
            if(!team) return null;
            if(notValues) return team;
            return team.values;
        }).catch(function(err){
            throw err;
        });

    };

    /**
     * Calculate a win on a stats object
     * @param {Object} _stats   pre-game stats
     * @param {Object} game     game data
     * @return {Object}         post-game stats
     */
    function addWinToStats(_stats, _game){
        var stats = _.extend({}, _stats);

        // increment games and wins
        stats.games++;
        stats.wins++;

        // update streak
        if(stats.streak >= 0){
            // on a hot streak, increment it
            stats.streak++;

            // is this the hottest streak we've had?
            if(stats.streak > stats.hottest){
                stats.hottest = stats.streak;
                stats.hottestEnd = null;
            }
        }
        else{
            // snapping a cold streak, aw yee

            // if this is the coldest streak, set the end date
            if(stats.streak === stats.coldest) stats.coldestEnd = _game.date;
            stats.streak = 1;
        }


        return stats;
    }

    /**
     * Calculate a loss on a stats object
     * @param {Object} _stats   pre-game stats
     * @param {Object} _game    game data
     * @return {Object}         post-game stats
     */
    function addLossToStats(_stats, _game){
        var stats = _.extend({}, _stats);

        // increment games and losses
        stats.games++;
        stats.losses++;

        // update streak
        if(stats.streak <= 0){
            // on a cold streak, decrement it
            stats.streak--;

            // is this the coldest streak we've had?
            if(stats.streak < stats.coldest){
                stats.coldest = stats.streak;
                stats.coldestEnd = null;
            }
        }
        else{
            // breaking a hot streak, aw shit.

            // if it was the hottest, set the end date.
            if(stats.streak === stats.hottest) stats.hottestEnd = _game.date;
            stats.streak = -1;
        }


        return stats;
    }


    /**
     * Create a new team
     * @param  {String} name
     * @return {Object}
     */
    api.teams.create = function(data){
        var name = data.name;
        //var compId = data.compId;

        if(!name) throw {status:400, message: 'teams.create() requires a name'};


        // add the team to the DB
        return models.Team.create({
            name: name,
            //compId: compId
        }).then(function(team){

            // now create a new Stat model and associate it with the team.
            return models.Stat.create({}).then(function(statObject){
                return team.setStat(statObject).then(function(stat){
                    return team.values;
                });
            });

            // // now associate the players
            // return team.setPlayers(players).then(function(players){
            //     return models.Stat.create({});
            // }).then(function(stat){
            //     return team.setStat(stat).then(function(stat){
            //         return team.values;
            //     });
            // });
        });

    };

    /**
     * Delete a team and its associated entities
     * @param  {Sequelize.model} model
     * @return {Boolean}
     */
    api.teams.delete = function(model){
        var teamId = Number(model.values.id);

        // todo
        // THIS IS BROKEN. NEEDS A FIX.

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
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find all games, optionally filtered
     * @param  {Object} where
     * @return {Array}
     */
    api.games.findAll = function(where){
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
    api.games.findOne = function(where, notValues){
        return models.Game.find({
            where: where || {},
            include: [{
                model: models.Team,
                attributes: ['name', 'id']
            }]
        }).then(function(game){
            if(!game) return null;
            if(notValues) return game;
            return game.values;
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Return an array of games matching the provided team IDs
     * @param  {Array} teamIds
     * @return {Array}
     */
    api.games.findByTeams = function(teamIds){
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
    api.games.create = function(data, notValues){
        var teamIds = data.teamIds;
        var compId = data.compId;
        return api.teams.findAll({
            id: teamIds
            //compId: compId
        }).then(function(teams){
            if(!teams || teams.length !== 2) throw new Error('Invalid team IDs');

            return models.Game.create({
                compId: compId
            }).then(function(game){
                return game.setTeams(teams).then(function(teams){
                    if(notValues){
                        game.values.teams = teams;
                        return game;
                    }
                    // return the game with the teams attached.
                    return _.extend({}, game.values, {
                      teams: teams
                    });
                });
            });
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Update a game
     * @param  {Sequelize Model} gameModel
     * @param {Object} udpatedData
     */
    api.games.update = function(gameModel, updatedData){
        // to update a game, we need winningTeamId, losingTeamId.
        var requiredFields = ['winningTeamId', 'losingTeamId'];
        var missingFields = _.difference(requiredFields, Object.keys(updatedData));
        if(missingFields.length) throw new Error ('games.update() missing arguments: ' + missingFields.join(', '));

        // are the teams we've been given actually valid for this game?
        var teams = _.map(gameModel.values.teams, function(team){
            return team.dataValues.id;
        });
        console.log('teams are ');
        console.dir(teams);
        if(!~teams.indexOf(updatedData.winningTeamId) || !~teams.indexOf(updatedData.losingTeamId) || updatedData.winningTeamId === updatedData.losingTeamId) throw new Error('invalid winningTeamId and losingTeamId team IDs');

        // was there previously a result set for this game?
        var hadResult = gameModel.values.winningTeamId || gameModel.values.losingTeamId;

        // todo - check here if the results are actually different. if nothing changed (ie, they just hit save by mistake)
        // then we don't need to do anything.

        // ok, arguments are all valid, let's update the game.
        return gameModel.updateAttributes({
            winningTeamId: updatedData.winningTeamId,
            losingTeamId: updatedData.losingTeamId,
            date: updatedData.date
        }).then(function(game){

            // If this game previously had a result recorded, the stats table for the comp needs to be regenerated.
            // todo - it would be possible to create a shortcut here, provided that the game is the most recent game
            // played in the comp.  You could just roll back the results in the stats for each team/player without
            // having to do a complete regeneration.
            // TODO - need to refresh all team stats too because teams are now outside of comps
            if(hadResult){
                console.log('Game had previously recorded result, updating comp stats table');
                return api.stats.refreshCompStats(gameModel.compId).then(function(){
                    return game;
                });
            }

            // otherwise, we're adding a result for the first time, so
            // we can just call the .addWin and .addLoss stats helpers.
            return api.teams.recordWin(game.values).then(function(){
                return api.teams.recordLoss(game.values).then(function(){
                    return game;
                });
            });

        }).catch(function(err){
            throw err;
        });

    };

    /**
     * Find all users, optionally filtered by where object
     * @param  {Object} where
     * @return {Array}
     */
    api.users.findAll = function(where, notValues){
        return models.User.findAll({
            where: where,
            attributes: ['name', 'id']
        }).then(function(users){
            if(notValues) return users;
            return _.pluck(users, 'values');
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find a single user
     * @param  {Object} where     where clause filter
     * @param  {Boolean} notValues return model, not model.values
     * @return {Object}
     */
    api.users.findOne = function(where, notValues){
        return models.User.find({
            where: where,
            attributes: ['name', 'id']
        }).then(function(user){
            if(!user) return null;
            if(notValues) return user;
            return user.values;
        }).catch(function(err){
            throw err;
        });
    };


    api.comps.findAll = function(where, notValues){
        return models.Comp.findAll({
            where: where,
            include: [{
                model: models.User,
                as: 'members',
                attributes: ['id', 'name']
            }, {
                model: models.User,
                as: 'moderators',
                attributes: ['id', 'name']
            }]
        }).then(function(comps){
            if(notValues) return comps;
            return _.pluck(comps, 'values');
        }).catch(function(err){
            throw err;
        });
    };



    api.comps.findOne = function(where, notValues){
        return models.Comp.find({
            where: where,
            include: [{
                model: models.User,
                as: 'members',
                attributes: ['id', 'name']
            }, {
                model: models.User,
                as: 'moderators',
                attributes: ['id', 'name']
            }]
        }).then(function(comp){
            if(!comp) return null;
            if(notValues) return comp;
            return comp.values;
        }).catch(function(err){
            throw err;
        });
    };

    // todo - this is a pretty ridiculous query, we can probably soften it up a bit? or maybe just need the frontend
    // to break it into parts...
    api.comps.findOneDetailed = function(where, notValues){
        return models.Comp.find({
            where: where,
            include: [{
                model: models.Team,
                include: {
                    model: models.Stat
                }
            }, {
                model: models.Game
            }, {
                model: models.User,
                as: 'members',
                attributes: ['id', 'name']
            }, {
                model: models.User,
                as: 'moderators',
                attributes: ['id', 'name']
            }]
        }).then(function(comp){
            if(!comp) return null;
            if(notValues) return comp;
            return comp.values
        }).catch(function(err){
            throw err;
        })
    };


    api.comps.create = function(data){
        // todo - validation
        return models.Comp.create(data).then(function(comp){
            return comp.values;
        }).catch(function(err){
            throw err;
        });
    };

    api.comps.update = function(id, data){
        // todo - more stringent validation
        var validFields = ['name', 'public', 'membersAreMods'];
        var members = data.members;
        var moderators = data.moderators;
        var validData = _.pick(data, validFields);

        return api.comps.findOne({
            id: id
        }, true).then(function(comp){
            if(!comp) return null;

            return comp.updateAttributes(validData).then(function(comp){

                // now setmembers and setmoderators
                return api.users.findAll({
                    id: members
                }, true).then(function(members){
                    return comp.setMembers(members);
                }).then(function(members){
                    return api.users.findAll({
                        id: moderators
                    }, true).then(function(moderators){
                        return comp.setModerators(moderators);
                    }).then(function(moderators){
                        return _.extend({}, comp.values, {
                            members: _.pluck(members, 'values'),
                            moderators: _.pluck(moderators, 'values')
                        });
                    });
                });
            });
        }).catch(function(err){
            throw err;
        });
    };

    // todo - if sequelize isn't cleaning up all related moels, we need to do it manually here
    // probably safest to perform a transaction
    api.comps.delete = function(id){
        return models.Comp.find({
            where: {
                id: id
            }
        }).then(function(comp){
            if(!comp) return false;
            return comp.destroy();
        }).then(function(){
            return true;
        }).catch(function(err){
            throw err;
        });
    };

    return api;

};
