/**
 * Teams service
 */

(function(){
    'use strict';

    angular.module('pong').factory('teams', ['$http', 'stats', 'leagues', 'games', function($http, statsService, leaguesService, gamesService){

        var TeamsService = function(){};

        TeamsService.prototype.getTeams = function(){
            return $http.get(apiRoot()).then(function(response){
                response.data = _.map(response.data, function(team){
                    team = parseTeam(team);
                    team.stat = statsService.parseStats(team.stat);
                    return team;
                });
                return response.data;
            });
        };

        TeamsService.prototype.getTeam = function(id){
            return $http.get(apiRoot() + id + '/').then(function(response){
                var team = parseTeam(response.data);
                return team;
            });
        };

        TeamsService.prototype.getTeamWithDetails = function(id){
            return $http.get(apiRoot() + id + '/all/').then(function(response){
                var team = parseTeam(response.data);
                team.stat = statsService.parseStats(team.stat);
                return team;
            });
        };

        /**
         * Fetch the games for a given team
         * @param  {Number} id      teamId
         * @return {Array}
         */
        TeamsService.prototype.getTeamGames = function(id){
            return $http.get(apiRoot() + id + '/games/').then(function(response){
                return _.map(response.data, gamesService.parseGame);
            });
        };

        TeamsService.prototype.getTeamByPlayers = function(players){
            var playersString = players.join(',');
            return $http.get(apiRoot() + 'search/' + playersString +'/').then(function(response){
                var team = parseTeam(response.data);
                team.stat = statsService.parseStats(team.stat);
                return team;
            });
        };

        TeamsService.prototype.addTeam = function(players, name){
            if(!players || !players.length || !name) throw new Error('shitty arguments, bro.');
            return $http.post(apiRoot(), {
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

            return $http.put(apiRoot() + teamData.id + '/', teamData).then(function(response){
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

        // return the teams API root URL
        // checks the leagues service for the current active League Id
        function apiRoot(){
            return '/api/v1/leagues/' + leaguesService.getActiveLeagueId() + '/teams/';
        }

        return new TeamsService();

    }]);

})();
