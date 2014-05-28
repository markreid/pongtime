/**
 * Teams service
 */

(function(){
    'use strict';

    angular.module('pong').factory('teams', ['$http', 'stats', 'leagues', function($http, statsService, leaguesService){

        var TeamsService = function(){};

        TeamsService.prototype.getTeams = function(){
            return $http.get('/api/v1/teams/').then(function(response){
                response.data = _.map(response.data, function(team){
                    team = parseTeam(team);
                    team.stat = statsService.parseStats(team.stat);
                    return team;
                });
                return response.data;
            });
        };

        TeamsService.prototype.getTeam = function(id){
            return $http.get('/api/v1/teams/' + id + '/').then(function(response){
                var team = parseTeam(response.data);
                team.stat = statsService.parseStats(team.stat);
                return team;
            });
        };

        TeamsService.prototype.getTeamByPlayers = function(players){
            var playersString = players.join(',');
            return $http.get('/api/v1/teams/search/' + playersString +'/').then(function(response){
                var team = parseTeam(response.data);
                team.stat = statsService.parseStats(team.stat);
                return team;
            });
        };

        TeamsService.prototype.addTeam = function(players, name){
            if(!players || !players.length || !name) throw new Error('shitty arguments, bro.');
            return $http.post('/api/v1/teams/', {
                leagueId: leaguesService.getActiveLeagueId(),
                players: players,
                name: name
            }).then(function(response){
                var team = parseTeam(response.data);
                team.stat = statsService.parseStats(team.stat);
                return team;
            });
        };

        TeamsService.prototype.saveTeam = function(teamData){
            var validFields = ['name'];
            var validData = _.pick(teamData, validFields);
            console.log(validData);

            return $http.put('/api/v1/teams/' + teamData.id + '/', teamData).then(function(response){
                var team = parseTeam(response.data);
                team.stat = statsService.parseStats(team.stat);
                return team;
            });
        };

        function parseTeam(team){
            team.url = '/teams/' + team.id + '/'
            team.playerNames = _.pluck(team.players, 'name').join(' and ');
            team.players = _.map(team.players, function(player){
                player.url = '/players/' + player.id;
                return player;
            });
            return team;
        };

        return new TeamsService();

    }]);

})();
