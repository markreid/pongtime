/**
 * populate.js
 * fill the db with dummy data
 */

var db = require('./models');

db.sequelize.sync({
    force:true
}).done(function(){
    return db.Player.create({
        name: 'Mark'
    });
}).then(function(){
    return db.Player.create({
        name: 'Lyndo'
    });
}).then(function(){
    return db.Player.create({
        name: 'Sean'
    });
}).then(function(){
    return db.Player.create({
        name: 'Gaurav'
    });
}).then(function(){
    return db.Team.create({
        name: 'Mark Team'
    });
}).then(function(team){
    return db.Player.find({
        where: {
            id: 1
        }
    }).then(function(player){
        return team.setPlayers([player]);
    }).then(function(){
        return db.Stat.create({});
    }).then(function(stat){
        return team.setStat(stat);
    });
}).then(function(data){
    return db.Team.create({
        name: 'Lyndo Team'
    });
}).then(function(team){
    return db.Player.find({
        where: {
            id: 2
        }
    }).then(function(player){
        return team.setPlayers([player]);
    }).then(function(){
        return db.Stat.create({});
    }).then(function(stat){
        return team.setStat(stat);
    });
}).then(function(){
    return db.Team.create({
        name: 'Sean Team'
    });
}).then(function(team){
    return db.Player.find({
        where: {
            id: 3
        }
    }).then(function(player){
        return team.setPlayers([player]);
    }).then(function(){
        return db.Stat.create({});
    }).then(function(stat){
        return team.setStat(stat);
    });
}).then(function(){
    return db.Team.create({
        name: 'The Governor'
    });
}).then(function(team){
    return db.Player.find({
        where: {
            id: 4
        }
    }).then(function(player){
        return team.setPlayers([player]);
    }).then(function(){
        return db.Stat.create({});
    }).then(function(stat){
        return team.setStat(stat);
    });
}).then(function(){
    return db.Game.create({});
}).then(function(game){
    return db.Team.findAll({
        where: {
            id: [1,2]
        }
    }).then(function(teams){
        return game.setTeams(teams).then(function(newgame){
            return teams[0].setWinner(game);
        }).then(function(){
            return teams[1].setLoser(game);
        }).then(function(game){
            return game.updateAttributes({
                pants: false,
                redemption: true
            });
        });
    });
}).then(function(){
    return db.Stat.create({}).then(function(stat){
        return db.Team.find({
            where: {
                id: 1
            }
        }).then(function(team){
            return stat.setTeam(team);
        });
    });
}).then(function(team){
    console.log(team.values);
});

