/**
 * dbutils.js
 * helper utilities for db-related stuff
 * migrations, syncs, etc.
 *
 * call from the command line
 */

var prompt = require('prompt');

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
    linkuserwithplayer: function(){
        prompt.start();
        prompt.get(['user', 'playerID'], function(err, data){
            db.User.find({
                where: {
                    id: data.user
                }
            }).success(function(user){
                if(!user){
                    console.warn('unknown user with PK ' + data.user);
                    process.exit(1);
                }
                db.Player.find({
                    where: {
                        id: data.playerID
                    }
                }).success(function(player){
                    console.log('found player ' + data.playerID);
                    user.setPlayer(player).success(function(user){
                        console.log('updated User model: \n');
                        console.log(user.values);
                        process.exit();
                    }).fail(function(err){
                        throw(err);
                    });
                }).fail(function(err){
                    throw err;
                });
            }).fail(function(err){
                throw err;
            });
        })
    },
    addplayer: function(){
        prompt.start();
        prompt.get(['name'], function(err, data){
            db.Player.create({
                name: data.name
            }).success(function(player){
                console.log('created player:');
                console.log(player.values);
            }).fail(function(err){
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
