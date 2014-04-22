(function(){
    'use strict';

    angular.module('pong').controller('indexController', ['$scope', '$timeout', 'players', function($scope, $timeout, players){

        $scope.reset = function(){
            $scope.refreshing = true;

            // set defaults
            $scope.numTeams = 2;
            $scope.playersPerTeam = 2;
            $scope.getPlayers().finally(function(){
                $scope.refreshing = false;
            });

        };

        $scope.getPlayers = function(){
            return players.getPlayers().success(function(players){
                $scope.players = _.map(players, function(player){
                    return _.extend(player, {active:true});
                });
            });
        };

        $scope.toggleActive = function(childScope){
            childScope.player.active = !childScope.player.active;
        };

        $scope.runTeamGenerator = function(){
            var loops = 40;
            var timeout = 150;
            while(loops--){
                timeout = timeout *0.95;
                $timeout($scope.generateTeams, loops*timeout);
            }
        };

        $scope.generateTeams = function(){
            var allPlayers = $scope.players.slice();
            var players = _.filter(allPlayers, function(player){
                return player.active
            });
            var numTeams = Number($scope.numTeams);
            var playersPerTeam = Number($scope.playersPerTeam);
            var numPlayers = numTeams * playersPerTeam;

            if(players.length < numPlayers){
                $scope.warning = 'There\'s not enough players for that many teams.';
                return false;
            }

            // first reduce it to the number of players we need
            while(players.length > numPlayers){
                spliceRandom(players);
            }

            // now make the teams
            var teams = [];
            teams.push([]);
            while(players.length){
                var newestTeam = teams[teams.length-1];
                var player = spliceRandom(players)[0];
                newestTeam.push(player);

                if(newestTeam.length === playersPerTeam && players.length){
                    teams.push([]);
                }
            }

            _.each(teams, function(team){
                team.playersString = _.pluck(team, 'name').join(' and ');
            });
            $scope.teams = teams;

        };

        var spliceRandom = function(arr){
            var random = Math.floor(Math.random() * arr.length);
            return arr.splice(random, 1);
        }

        $scope.reset();

    }]);
})();
