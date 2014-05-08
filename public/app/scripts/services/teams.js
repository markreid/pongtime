/**
 * Teams service
 */

(function(){
    'use strict';

    angular.module('pong').factory('teams', ['$http', function($http){

        var TeamsService = function(){};

        TeamsService.prototype.getTeams = function(){
            return $http.get('/api/v1/teams/');
        };

        TeamsService.prototype.getTeam = function(id){
            return $http.get('/api/v1/teams/' + id + '/');
        };

        TeamsService.prototype.getTeamByPlayers = function(players){
            var playersString = players.join(',');
            return $http.get('/api/v1/teams/search/' + playersString +'/');
        };

        TeamsService.prototype.addTeam = function(players, name){
            if(!players || !players.length || !name) throw new Error('shitty arguments, bro.');
            return $http.post('/api/v1/teams/', {
                players: players,
                name: name
            });
        };

        return new TeamsService();

    }]);

})();
