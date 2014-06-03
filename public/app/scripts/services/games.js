/**
 * games service
 */

(function(){
    'use strict';

    angular.module('pong').factory('games', ['$http', '$q', 'leagues', function($http, $q, leaguesService){

        var GamesService = function(){};

        /**
         * Fetch all games
         * @return {Array} [description]
         */
        GamesService.prototype.getGames = function(){
            return $http.get(apiRoot()).then(function(response){
                return _.map(response.data, parseGame);
            });
        };

        /**
         * Fetch a single game by ID
         */
        GamesService.prototype.getGame = function(id){
            return $http.get(apiRoot() + id + '/').then(function(response){
                return parseGame(response.data);
            });
        };

        GamesService.prototype.add = function(data){
            return $http.post(apiRoot(), data).then(function(response){
                return response.data;
            });
        };

        GamesService.prototype.save = function(data){
            // validation
            // we require .id, .winningTeamId:num, .losingTeamId:num and .redemption:bool
            if(~[data.id, data.winningTeamId, data.losingTeamId, data.redemption].indexOf(null)) throw new Error('missing parameters.');

            return $http.put(apiRoot() + Number(data.id), {
                winningTeamId: data.winningTeamId,
                losingTeamId: data.losingTeamId,
                redemption: data.redemption,
                date: data.date.toString()
            }).then(function(response){
                return response.data;
            });
        };

		GamesService.prototype.delete = function(gameid){
			return $http.delete(apiRoot() + Number(gameid)).then(function(response){
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
            return $http.get(apiRoot() + 'search/' + teamIdString + '/').then(function(response){
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


        function parseGame(game){
            if(game.winningTeamId){
                game.winningTeam = _.find(game.teams, function(team){
                    return game.winningTeamId === team.id;
                });
            }
            if(game.losingTeamId){
                game.losingTeam = _.find(game.teams, function(team){
                    return game.losingTeamId === team.id;
                });
            }

            game.humanDate = moment(game.date).format('MMM Do')
            return game;
        }

        // return the games API root URL
        // checks the leagues service for the current active League Id
        function apiRoot(){
            return '/api/v1/leagues/' + leaguesService.getActiveLeagueId() + '/games/';
        }

        /**
         * put parseGame on the service so we can access it from outside
         */
        GamesService.prototype.parseGame = parseGame;

        return new GamesService();

    }]);

})();
