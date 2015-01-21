/**
 * dbutils.js
 * helper utilities for db-related stuff
 * migrations, syncs, etc.
 *
 * call from the command line
 */

var prompt = require('prompt');
var _ = require('underscore');
var Q = require('q');

var db = require('./index');

var args = process.argv.slice(2);

var calls = {
    sync: function(){
        if(args[1]){
            if(db[args[1]]){
                db[args[1]].sync({force:true}).success(function(){
                    console.log('synced ' + args[1]);
                    process.exit();
                }).fail(function(err){
                    throw err;
                });
            } else {
                console.warn('unknown model ' + args[1]);
                process.exit(1);
            }
        } else {
            db.sequelize.sync({force:true}).success(function(){
                console.log('db synced');
                process.exit();
            }).fail(function(err){
                throw err
            });

        }
    },
    createsuperuser: function(){
        prompt.start();
        prompt.get(['name', 'email', 'googleIdentifier'], function(err, data){
            data.auth = 3;
            db.User.create(data).success(function(model){
                console.log('created new User model: \n');
                console.log(model.values);
                process.exit();
            }).fail(function(err){
                throw err;
            });
        });
    },
    makesuperuser: function(){
        prompt.start();
        prompt.get(['pk'], function(err, data){
            db.User.find({
                where: {
                    id: data.pk
                }
            }).success(function(user){
                if(!user) throw 'No user found';
                user.updateAttributes({
                    auth: 3
                }).success(function(user){
                    console.log('updated user ' + data.pk + ' to auth 3.');
                    process.exit();
                }).fail(function(err){
                    throw err;
                });
            }).fail(function(err){
                throw err;
            });
        });
    },
    simgames: function(){
        prompt.start();
        prompt.get(['compId', 'numGames'], function(err, data){
            var compId = Number(data.compId);
            var numGames = Number(data.numGames);
            if(isNaN(compId) || compId < 1 || isNaN(numGames) || numGames < 1) throw 'Bad inputs';

            // fetch all the teams
            db.api.teams.findAll({
                compId: compId
            }).then(function(teams){

                var allTeamIds = _.pluck(teams, 'id');

                var operations = [];

                while(numGames--){
                    (function(){
                        // get two random team IDs
                        var teamIds = _.sample(allTeamIds, 2);
                        console.log('IDS:');
                        console.log(teamIds);
                        //return;

                        operations.push(db.api.games.create({
                            teamIds: teamIds,
                            compId: compId
                        }, true).then(function(game){
                            // we need to fake this here. it's quite annoying.
                            game.values.teams = _.map(game.values.teams, function(team, i){
                                team.dataValues = {
                                    id: teamIds[i]
                                };
                                return team;
                            });

                            return db.api.games.update(game, {
                                winningTeamId: teamIds[0],
                                losingTeamId: teamIds[1],
                                date: new Date()
                            });

                        }));
                    })();
                }

                // use Q to queue up all our DB ops
                return Q.all(operations)

            }).then(function(){
                console.log('Done. Simulated ' + data.numGames + ' games.');
            }).catch(function(err){
                throw err;
            });

        });
    }
}

if(calls[args[0]]){
    calls[args[0]]();
} else {
    console.warn('unknown option ' + args[0]);
}
