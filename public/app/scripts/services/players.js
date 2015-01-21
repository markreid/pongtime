/**
 * players service
 */

(function(){
    'use strict';

    angular.module('pong').factory('players', ['$http', 'stats', 'comps', function($http, statsService, compsService){

        var PlayersService = function(){};


        /**
         * Request a single player from the API
         * @param  {Number} id
         * @return {Object}
         */
        PlayersService.prototype.getPlayer = function(id){
            return $http.get(apiRoot() + id).then(function(response){
                return parsePlayer(response.data);
            });
        };

        PlayersService.prototype.getPlayerDetailed = function(id){
            return $http.get(apiRoot() + id + '/all/').then(function(response){
                return parsePlayer(response.data);
            });
        };

        /**
         * Request all players from the API
         * @return {Array}
         */
        PlayersService.prototype.getPlayers = function(){
            return $http.get(apiRoot()).then(function(response){
                var players = _.map(response.data, parsePlayer);
                return players;
            });
        };

        /**
         * Add a player via the API
         * @param {Object} data
         */
        PlayersService.prototype.add = function(data){
            return $http.post(apiRoot(), data).then(function(response){
                return response.data;
            });
        };

        PlayersService.prototype.save = function(playerData){
            var validFields = ['name'];
            var validData = _.pick(playerData, validFields);

            return $http.put(apiRoot() + playerData.id + '/', validData).then(function(response){
                return parsePlayer(response.data);
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
            player.stat = statsService.parseStats(player.stat);
            return player;
        };

        // return the players API root URL
        // checks the comps service for the current active Comp Id
        function apiRoot(){
            return '/api/v1/comps/' + compsService.getActiveCompId() + '/players/';
        }

        return new PlayersService();

    }]);

})();
