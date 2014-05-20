/**
 * players service
 */

(function(){
    'use strict';

    angular.module('pong').factory('players', ['$http', 'stats', function($http, statsService){

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
            // add a slug, if we don't have one.
            if(!data.slug) data.slug = slugify(data.name);
            return $http.post('/api/v1/players', data).then(function(response){
                return response.data;
            });
        };

        PlayersService.prototype.save = function(playerData){
            var validFields = ['name'];
            var validData = _.pick(playerData, validFields);

            return $http.put('/api/v1/players/' + playerData.id + '/', validData).then(function(response){
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

        // todo - put this in utils somewhere, or maybe add it as a filter? could allow clientside editing that way...
        function slugify(str){
            if (str == null) return '';

            var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
                to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
                regex = new RegExp(from, 'g');

            str = String(str).toLowerCase().replace(regex, function(c){
            var index = from.indexOf(c);
            return to.charAt(index) || '-';
            });

            str = str.replace(/[^\w\s-]/g, '');
            return str.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
        };

        return new PlayersService();

    }]);

})();
