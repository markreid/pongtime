var _ = require('underscore');
var Sequelize = require('sequelize');
var Q = require('q');

module.exports = function(sequelize, models){
    'use strict';

    var api = {
        players: {},
        teams: {},
        stats: {},
        games: {},
        users: {},
        leagues: {},
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
     * Update stat values with a win for a team and its players
     * @param {Object} gameData     game model values
     */
    api.teams.recordWin = function(gameData){
        return models.Team.find({
            where: {
                id: gameData.winningTeamId
            },
            include: [{
                model: models.Stat
            }, {
                model: models.Player,
                include: [{
                    model: models.Stat
                }]
            }]
        }).then(function(team){
            if(!team.stat) throw new Error('Unable to find stat model for team ' + team.values.id);

            var updatedStats = addWinToStats(team.stat.values, gameData);

            return team.stat.updateAttributes(updatedStats).then(function(stat){
                return api.players.recordWins(team.players, gameData);
            });
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
            }, {
                model: models.Player,
                include: [{
                    model: models.Stat
                }]
            }]
        }).then(function(team){
            if(!team.stat) throw new Error('Unable to find stat model for team ' + team.values.id);

            var updatedStats = addLossToStats(team.stat.values, gameData);
            return team.stat.updateAttributes(updatedStats).then(function(stat){
                return api.players.recordLosses(team.players, gameData);
            });
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
     * Find all players
     * @param {where} Object        where clause
     * @param {Boolean} notValues   return .values or model instance?
     * @return {Object}     model.values
     */
    api.players.findAll = function(where, notValues){
        return models.Player.findAll({
            where: where || {},
            attributes: ['name', 'id', 'leagueId'],
            include: [{
                model: models.Team
            }, {
                model: models.Stat
            }, {
                model: models.League,
                attributes: ['id']
            }],
            order: 'id'
        }).then(function(players){
            if(notValues) return players;
            return _.pluck(players, 'values');
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Find a single player with extra associated models
     * @param  {Object} where   filter data
     * @param  {Boolean} notValues  set true to pass the model, not the values
     * @return {Object}         model.values
     */
    api.players.findOneDetailed = function(where, notValues){
        return models.Player.findAll({
            where: where || {},
            include: [{
                model: models.Team
            }, {
                model: models.Stat
            }],
            order: 'id',
            limit: 1
        }).then(function(players){
            if(!players.length) return null;

            // if notValues is true, we want to return the model
            if(notValues) return players[0];
            return players[0].values
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Create a player and associate a new stat model
     * @param  {Object} data
     * @return {Object}      model.values
     */
    api.players.create = function(data){
        // todo - validation here
        return models.Player.create(data).then(function(player){
            return models.Stat.create({}).then(function(stat){
                return player.setStat(stat);
            }).then(function(){
                return player.values;
            });
        }).catch(function(err){
            throw err;
        });
    };

    /**
     * Record wins for 1 or more players
     * @param {Array} players       player models array
     * @param {Object} gameData
     * @return {Promise} chainer.run()
     */
    api.players.recordWins = function(players, gameData){
        var chainer = new Sequelize.Utils.QueryChainer();
        _.each(players, function(player){
            var updatedStats = addWinToStats(player.stat.values, gameData);
            chainer.add(player.stat.updateAttributes(updatedStats));
        });
        return chainer.run();
    };

    /**
     * Record losses for 1 or more players
     * @param {Array} players       player models array
     * @param {Object} gameData
     * @return {Promise} chainer.run();
     */
    api.players.recordLosses = function(players, gameData){
        var chainer = new Sequelize.Utils.QueryChainer();
        _.each(players, function(player){
            var updatedStats = addLossToStats(player.stat.values, gameData);
            chainer.add(player.stat.updateAttributes(updatedStats));
        });
        return chainer.run();
    };

    /**
     * Find all teams
     * @param  {Object} where   filter params
     * @return {Object}         model.values
     */
    api.teams.findAll = function(where, notValues){
        return models.Team.findAll({
            where: where || {},
            attributes: ['name', 'id', 'leagueId'],
            include: [{
                model: models.Player,
                attributes: ['name', 'id']
            }, {
                model: models.Stat
            }, {
                model: models.League,
                attributes: ['id']
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
                model: models.Player,
                attributes: ['name', 'id']
            }, {
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
     * Fetch a team ID by searching for its players
     * @param  {Array} playerIDs
     * @return {Number}
     */
    api.teams.getTeamIdByPlayers = function(playerIDs, leagueId){
        // todo - utilize the leagueId parameter
        // theoretically it makes no difference but you're allowing information
        // leak if you let people search across leagues.

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
    api.teams.getTeamByPlayers = function(playerIDs, leagueId){
        return api.teams.getTeamIdByPlayers(playerIDs).then(function(teamId){
            if(!teamId) return null;
            return models.Team.find({
                where: {
                    id: teamId
                },
                include: [models.Player, models.Stat]
            }).then(function(team){
                if(!team) return null;
                return team.values;
            });
        });
    };

    /**
     * Regenerates the stats for every team and player in the given league
     * @param {Number} leagueId
     * @returns {Promise} DB operations promise
     */
    api.stats.refreshLeagueStats = function(leagueId){

        // We fetch every single game that's been played in the league, ordering chronologically.

        return api.games.findAllWithPlayers({
            leagueId: leagueId
        }).then(function(games){
            console.log('stats.refreshLeagueStats() found ' + games.length + ' games to process.');

            // Generate a fresh Stat model, which we use as a template, and create an object to hold
            // all of our player and team stats models.
            var cleanStats = models.Stat.build({}).values;
            var playerStats = {};
            var teamStats = {};

            // Iterate through the games, checking the winningTeamId and losingTeamId.
            // If this is the first time we've seen this team, clone cleanStats and put it in teamStats, referenced by ID.
            // Otherwise, update the existing object in teamStats.
            _.each(games, function(game){

                teamStats[game.winningTeamId] = addWinToStats(teamStats[game.winningTeamId] || _.extend({}, cleanStats), game);
                teamStats[game.losingTeamId] = addLossToStats(teamStats[game.losingTeamId] || _.extend({}, cleanStats), game);

                // Now we do the same with the players in each team.
                _.each(game.teams, function(team){

                    var winningTeam = team.id === game.winningTeamId;

                    _.each(team.players, function(player){
                        if(winningTeam){
                            playerStats[player.id] = addWinToStats(playerStats[player.id] || _.extend({}, cleanStats), game);
                        } else {
                            playerStats[player.id] = addLossToStats(playerStats[player.id] || _.extend({}, cleanStats), game);
                        }
                    });

                });
            });

            // We now have regenerated Stat models for every team and every player in the league.
            // So we need to overwrite the DB Stats with our new values.

            var teamIds = Object.keys(teamStats);
            var playerIds = Object.keys(playerStats);

            var teamOperations = [];
            var playerOperations = [];

            // Fetch all the relevant teams from the DB, and call updateAttributes on each of them,
            // pushing the call into our teamOperations array.
            return api.teams.findAll({
                id: teamIds
            }, true).then(function(teams){
                _.each(teams, function(team){
                    teamOperations.push(team.stat.updateAttributes(teamStats[team.id]));
                });
            }).then(function(){

                // Do the same with each of the players
                return api.players.findAll({
                    id: playerIds
                }, true).then(function(players){
                    _.each(players, function(player){
                        playerOperations.push(player.stat.updateAttributes(playerStats[player.id]));
                    });
                });
            }).then(function(){
                // teamOperations and playerOperations are now arrays full of promises for DB operations.
                // Wrap them with Q.all so we can fire a response when they have all finished updating.
                return Q.all(teamOperations.concat(playerOperations));

            }).then(function(){
                console.log('refreshed stats table for league ' + leagueId);
                return true;
            }).catch(function(err){
                throw err;
            });

        });

    };

    /**
     * Find a team, including its players and all its games.
     */
    api.teams.getTeamWithGames = function(where, notValues){
        return models.Team.find({
            where: where,
            include: [{
                model: models.Game
            }, {
                model: models.Player
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

        // if redemption was won, it means the winners gave it away.
        if(_game.redemption) stats.redemptionsGiven++;

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

        // did they at least win redemption?
        if(_game.redemption) stats.redemptionsHad++;

        return stats;
    }


    /**
     * Create a new team, given a name and player IDs
     * @param  {String} name
     * @param {Array} playerIDs
     * @return {Object}
     */
    api.teams.create = function(data){
        var name = data.name;
        var playerIds = data.playerIds;
        var leagueId = data.leagueId;

        if(!name || !playerIds || !leagueId) throw {status:400, message: 'teams.create() requires 3 arguments'};
        // First we need to ensure a team doesn't exist with these players
        return api.teams.getTeamIdByPlayers(playerIds).then(function(teamId){
            if(teamId) throw {status:409, message: 'Team exists: ' + teamId};

            // now get the players
            return api.players.findAll({
                id: playerIds,
                leagueId: leagueId
            });
        }).then(function(players){
            if(!players || !players.length || players.length !== playerIds.length) throw {status:400, message: 'Invalid player IDs'};

            // add the team to the DB
            return models.Team.create({
                name: name,
                leagueId: leagueId
            }).then(function(team){

                // ok it gets a bit crazy here because we need to
                // refer to team, players and stat, all via closure

                // now associate the players
                return team.setPlayers(players).then(function(players){
                    return models.Stat.create({});
                }).then(function(stat){
                    return team.setStat(stat).then(function(stat){
                        return team.values;
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
     * Find all games, include teams and players
     * @param  {Object} where
     * @return {Array}
     */
    api.games.findAllWithPlayers = function(where){
        return models.Game.findAll({
            where: where || {},
            include: [{
                model: models.Team,
                include: [{
                    model: models.Player
                }]
            }],
            order: 'date'
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
     * Not the same as .getTeamGames - this will return only
     * games that all given teams played in
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
     * Return games that a team has played in, ordered by date.
     * Not the same as .findByTeams - this will find all the games
     * that one team has played in.
     * todo - this query is wrong, it should return both teams
     */
    api.games.getTeamGames = function(team, notValues){
        return models.Game.findAll({
            include: {
                model: models.Team,
                attributes: ['id'],
            }, where: {
                'Teams.id': team
            }, order: 'date'
        }).then(function(games){
            if(notValues) return games;
            return _.pluck(games, 'values');
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
        var leagueId = data.leagueId;
        return api.teams.findAll({
            id: teamIds,
            leagueId: leagueId
        }).then(function(teams){
            if(!teams || teams.length !== 2) throw new Error('Invalid team IDs');

            return models.Game.create({
                leagueId: leagueId
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
        // to update a game, we need winningTeamId, losingTeamId, redemption.
        var requiredFields = ['winningTeamId', 'losingTeamId', 'redemption'];
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
            redemption: updatedData.redemption,
            date: updatedData.date
        }).then(function(game){

            // If this game previously had a result recorded, the stats table for the league needs to be regenerated.
            // todo - it would be possible to create a shortcut here, provided that the game is the most recent game
            // played in the league.  You could just roll back the results in the stats for each team/player without
            // having to do a complete regeneration.
            if(hadResult){
                console.log('Game had previously recorded result, updating league stats table');
                return api.stats.refreshLeagueStats(gameModel.leagueId).then(function(){
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


    api.leagues.findAll = function(where, notValues){
        return models.League.findAll({
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
        }).then(function(leagues){
            if(notValues) return leagues;
            return _.pluck(leagues, 'values');
        }).catch(function(err){
            throw err;
        });
    };



    api.leagues.findOne = function(where, notValues){
        return models.League.find({
            where: where
        }).then(function(league){
            if(!league) return null;
            if(notValues) return league;
            return league.values;
        }).catch(function(err){
            throw err;
        });
    };

    // todo - this is a pretty ridiculous query, we can probably soften it up a bit? or maybe just need the frontend
    // to break it into parts...
    api.leagues.findOneDetailed = function(where, notValues){
        return models.League.find({
            where: where,
            include: [{
                model: models.Team,
                include: {
                    model: models.Stat
                }
            }, {
                model: models.Game
            }, {
                model: models.Player,
                include: {
                    model: models.Stat
                }
            }, {
                model: models.User,
                as: 'members',
                attributes: ['id', 'name']
            }, {
                model: models.User,
                as: 'moderators',
                attributes: ['id', 'name']
            }]
        }).then(function(league){
            if(!league) return null;
            if(notValues) return league;
            return league.values
        }).catch(function(err){
            throw err;
        })
    };


    api.leagues.create = function(data){
        // todo - validation
        return models.League.create(data).then(function(league){
            return league.values;
        }).catch(function(err){
            throw err;
        });
    };

    api.leagues.update = function(id, data){
        // todo - more stringent validation
        var validFields = ['name', 'public', 'membersAreMods'];
        var members = data.members;
        var moderators = data.moderators;
        var validData = _.pick(data, validFields);

        return api.leagues.findOne({
            id: id
        }, true).then(function(league){
            if(!league) return null;

            return league.updateAttributes(validData).then(function(league){

                // now setmembers and setmoderators
                return api.users.findAll({
                    id: members
                }, true).then(function(members){
                    return league.setMembers(members);
                }).then(function(members){
                    return api.users.findAll({
                        id: moderators
                    }, true).then(function(moderators){
                        return league.setModerators(moderators);
                    }).then(function(moderators){
                        return _.extend({}, league.values, {
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
    api.leagues.delete = function(id){
        return models.League.find({
            where: {
                id: id
            }
        }).then(function(league){
            if(!league) return false;
            return league.destroy();
        }).then(function(){
            return true;
        }).catch(function(err){
            throw err;
        });
    };

    return api;

};
