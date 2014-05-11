/**
 * Teams service
 */

(function(){
    'use strict';

    angular.module('pong').factory('teams', ['$http', function($http){

        var TeamsService = function(){};

        TeamsService.prototype.getTeams = function(){
            return $http.get('/api/v1/teams/').then(function(response){
                response.data = _.map(response.data, function(team){
                    team = parseTeam(team);
                    team.stat = generateStats(team.stat);
                    return team;
                });
                return response.data;
            });
        };

        TeamsService.prototype.getTeam = function(id){
            return $http.get('/api/v1/teams/' + id + '/').then(function(response){
                var team = parseTeam(response.data);
                team.stat = generateStats(team.stat);
                return team;
            });
        };

        TeamsService.prototype.getTeamByPlayers = function(players){
            var playersString = players.join(',');
            return $http.get('/api/v1/teams/search/' + playersString +'/').then(function(response){
                var team = parseTeam(response.data);
                team.stat = generateStats(team.stat);
                return team;
            });
        };

        TeamsService.prototype.addTeam = function(players, name){
            if(!players || !players.length || !name) throw new Error('shitty arguments, bro.');
            return $http.post('/api/v1/teams/', {
                players: players,
                name: name
            }).then(function(response){
                var team = parseTeam(response.data);
                team.stat = generateStats(team.stat);
                return team;
            });
        };

        /**
         * Make the stats human-readable
         */
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
                if(stats.streak === 1){
                    paragraph += '1 win ';
                    streaktext = '1 win'  ;
                }
                if(stats.streak === -1){
                    paragraph += '1 loss ';
                    streaktext = '1 loss';
                }
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

                stats.streak = streaktext;
            }

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

        function parseTeam(team){
            team.url = '/teams/' + team.id + '/'
            team.playerNames = _.pluck(team.players, 'name').join(' and ');
            return team;
        };

        return new TeamsService();

    }]);

})();
