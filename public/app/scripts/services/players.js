/**
 * players service
 */

(function(){
    'use strict';

    angular.module('pong').factory('players', ['$http', function($http){

        var PlayersService = function(){};


        /**
         * Request a single player from the API
         * @param  {Number} id
         * @return {Object}
         */
        PlayersService.prototype.getPlayer = function(id){
            return $http.get('/api/v1/players/' + id).then(function(response){
                return parsePlayer(response.data);
            });
        };

        /**
         * Request all players from the API
         * @return {Array}
         */
        PlayersService.prototype.getPlayers = function(){
            return $http.get('/api/v1/players').then(function(response){
                var players = _.map(response.data, parsePlayer);
                return players;
            });
        };

        /**
         * Add a player via the API
         * @param {Object} data
         */
        PlayersService.prototype.add = function(data){
            return $http.post('/api/v1/players', data).then(function(response){
                return response.data;
            });
        };


        /**
         * Parse an API response to give us some extra data, human-readability, etc
         * @param  {Object} player API response
         * @return {Object}        parsed response
         */
        function parsePlayer(player){
            player.url = '/players/' + player.id;
            player.teams = _.map(player.teams, function(team){
                team.url = '/teams/' + team.id;
                return team;
            });
            return player;
        };

        function generateStats(player){

        };

        return new PlayersService();

    }]);

})();
