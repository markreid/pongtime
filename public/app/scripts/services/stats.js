/**
 * Stats service
 */

(function(){
    'use strict';

    angular.module('pong').factory('stats', ['$http', function($http){

        var StatsService = function(){};

        /**
         * Parses a stats model
         * @param  {[type]} stats [description]
         * @return {[type]}       [description]
         */
        StatsService.prototype.parseStats = function(stats){

            if(!stats) return {
                available: false,
                paragraph: 'Stats unavailable.'
            };

            // no games played yet, return zero stats.
            if(stats.games === 0){
                return {
                    games: 0,
                    wins: 0,
                    losses: 0,
                    streak: 0,
                    winPercentage: 0,
                    lossPercentage: 0,
                    available: false,
                    paragraph: 'No games played yet.'
                };
            }

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
            stats.streakReadable = streaktext;
            stats.coldest = Math.abs(stats.coldest);


            return _.extend({}, stats, {
                available: true,
                paragraph: paragraph
            });
        };

        return new StatsService();

    }]);

})();
