/**
 * Teams service
 */

(function(){
    'use strict';

    angular.module('pong').factory('teams', ['$http', 'stats', 'comps', 'games', function($http, statsService, compsService, gamesService){

        var TeamsService = function(){};

        TeamsService.prototype.getTeams = function(compID){
            return $http.get(compTeamsURL(compID)).then(function(response){
                response.data = _.map(response.data, function(team){
                    team = parseTeam(team);
                    team.stat = statsService.parseStats(team.stat);
                    return team;
                });
                return response.data;
            });
        };

        TeamsService.prototype.getTeam = function(id){
            return $http.get(compTeamsURL(0) + id + '/').then(function(response){
                var team = parseTeam(response.data);
                return team;
            });
        };

        TeamsService.prototype.getTeamWithDetails = function(id){
            return $http.get(compTeamsURL(0) + id + '/all/').then(function(response){
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
            return $http.get(compTeamsURL(0) + id + '/games/').then(function(response){
                return _.map(response.data, gamesService.parseGame);
            });
        };

        TeamsService.prototype.addTeam = function(name){
            if(!name) throw new Error('shitty arguments, bro.');
            return $http.post(compTeamsURL(0), {
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


        /**
         * Returns the API endpoint for teams from a given comp
         * @param  {String} [compID=0]
         * @return {String}
         */
        function compTeamsURL(compID){
            if(!compID){
                return '/api/v1/teams/';
            } else {
                return '/api/v1/comps/' + compID + '/teams/';
            }
        }

        return new TeamsService();

    }]);

})();
