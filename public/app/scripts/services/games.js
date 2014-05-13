/**
 * games service
 */

(function(){
    'use strict';

    angular.module('pong').factory('games', ['$http', '$q', function($http, $q){

        var GamesService = function(){};

        GamesService.prototype.getGames = function(){
            return $http.get('/api/v1/games').then(function(response){
                return response.data;
            });
        };

        GamesService.prototype.add = function(data){
            return $http.post('/api/v1/games', data).then(function(response){
                return response.data;
            });
        };

        GamesService.prototype.save = function(data){
            // validation
            // we require .id, .winningTeamId:num, .losingTeamId:num and .redemption:bool
            if(~[data.id, data.winningTeamId, data.losingTeamId, data.redemption].indexOf(null)) throw new Error('missing parameters.');

            return $http.put('/api/v1/games/' + Number(data.id), {
                winningTeamId: data.winningTeamId,
                losingTeamId: data.losingTeamId,
                redemption: data.redemption
            }).then(function(response){
                return response.data;
            });
        };

		GamesService.prototype.delete = function(gameid){
			return $http.delete('/api/v1/games/' + Number(gameid)).then(function(response){
				return response.data;
			});

		};

        /**
         * Query the API for the history of games between two teams
         * Parse the results into a human readable format
         */
        GamesService.prototype.getGameStats = function(teamIds){
            var t1 = teamIds[0];
            var t2 = teamIds[1];
            var teamIdString = teamIds.join(',');
            return $http.get('/api/v1/games/search/' + teamIdString + '/').then(function(response){
                var games = response.data;
                var gamesPlayed = games.length;
                if(!gamesPlayed) return null;

                var teamStats = _.map(teamIds, function(teamid){
                    return {
                        team: teamid,
                        played: gamesPlayed,
                        wins: _.where(games, {winningTeamId: teamid}).length,
                        losses: _.where(games, {losingTeamId: teamid}).length,
                        redemptionsGiven: _.where(games, {winningTeamId: teamid, redemption: true}).length,
                        redemptionsEarned: _.where(games, {losingTeamId: teamid, redemption: true}).length
                    }
                });

                // set everything to 0
                var stats = {
                    wins: {
                        t1: 0,
                        t2: 0
                    },
                    losses: {
                        t1: 0,
                        t2: 0
                    },
                    redemptionsWon: {
                        t1: 0,
                        t2: 0
                    },
                    redemptionsGiven: {
                        t1: 0,
                        t2: 0
                    }
                };

                // now count
                _.each(games, function(game){
                    if(game.winningTeamId === t1){
                        stats.wins.t1++;
                        stats.losses.t2++;
                        if(game.redemption === true){
                            stats.redemptionsGiven.t1++;
                            stats.redemptionsWon.t2++;
                        }
                    }
                    if(game.winningTeamId === t2){
                        stats.wins.t2++;
                        stats.losses.t1++;
                        if(game.redemption === true){
                            stats.redemptionsGiven.t2++;
                            stats.redemptionsWon.t1++;
                        }
                    }

                });

                // now map it into a format that can be used to generate a table in the template

                var tabularStats = [
                    {
                        title: 'Played',
                        t1: gamesPlayed,
                        t2: gamesPlayed
                    },
                    {
                        title: 'Wins',
                        t1: stats.wins.t1,
                        t2: stats.wins.t2
                    },
                    {
                        title: 'Losses',
                        t1: stats.losses.t1,
                        t2: stats.losses.t2
                    },
                    {
                        title: 'Redemptions Won',
                        t1: stats.redemptionsWon.t1,
                        t2: stats.redemptionsWon.t2
                    },
                    {
                        title: 'Redemptions Given',
                        t1: stats.redemptionsGiven.t1,
                        t2: stats.redemptionsGiven.t2,
                    }
                ];


                var streak = _.pluck(games.slice(-5), 'winningTeamId');

                return {
                    streak: streak,
                    stats: tabularStats
                };
            });
        };

        return new GamesService();

    }]);

})();
