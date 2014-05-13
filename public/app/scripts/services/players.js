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
            // add a slug, if we don't have one.
            if(!data.slug) data.slug = slugify(data.name);
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
            player.stat = generateStats(player.stat);
            return player;
        };

        function generateStats(stats){

            if(!stats) return {
                available: false,
                paragraph: 'Team stats unavailable'
            };
            if(stats.games === 0) return {
                available: false,
                paragraph: 'This team hasn\'t played a game yet.'
            };

            stats.winPercentage = Math.round((stats.wins/stats.games)*100);
            stats.lossPercentage = Math.round((stats.losses/stats.games)*100);

            // todo - this sucks
            var paragraph = stats.wins + ' out of ' + stats.games + ' wins (' + stats.winPercentage + '%)'
            var streaktext = '';

            if(stats.streak < -1 || stats.streak > 1){
                paragraph += ', ';

                if(stats.streak) paragraph += ' on a ';
                if(stats.streak < -1){
                    paragraph += Math.abs(stats.streak) + ' loss ';
                    streaktext = Math.abs(stats.streak) + ' losses';
                }
                if(stats.streak > 1){
                    paragraph += stats.streak + ' win ';
                    streaktext = stats.streak + ' wins';
                }
                if(stats.streak) paragraph += 'streak';

                if(stats.streak === stats.hottest) paragraph += ' (hottest!)';
                if(stats.streak === stats.coldest) paragraph += ' (coldest!)';
            }
            if(stats.streak === 1){
                streaktext = '1 win'  ;
            }
            if(stats.streak === -1){
                streaktext = '1 loss';
            }
            stats.streak = streaktext;
            stats.coldest = Math.abs(stats.coldest);

            // redemptions
            // db only stores redemptionsGiven and redemptionsHad, so to calculate
            // redemptionsDenied, we take the number of wins and subtract the
            // redemptionsGiven.
            stats.redemptionsDenied = stats.wins - stats.redemptionsGiven;
            stats.redemptionsDeniedPercentage = Math.round((stats.redemptionsDenied/stats.wins)*100);
            stats.redemptionsHadPercentage = Math.round((stats.redemptionsHad/stats.losses)*100);

            return _.extend({}, stats, {
                available: true,
                paragraph: paragraph
            });
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
