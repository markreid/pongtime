(function(){
    'use strict';

    angular.module('pong').controller('indexController', ['$scope', '$timeout', 'players', function($scope, $timeout, players){

        $scope.reset = function(){
            $scope.refreshing = true;

            // set defaults
            $scope.numTeams = 2;
            $scope.playersPerTeam = 2;
            $scope.showAddPlayer = false;
            $scope.getPlayers().finally(function(){
                $scope.refreshing = false;
            });

        };

        /**
         * Call the players service to fetch players from the DB
         */
        $scope.getPlayers = function(){
            return players.getPlayers().success(function(players){
                $scope.players = _.map(players, function(player){
                    return _.extend(player, {active:true});
                });
            });
        };

        /**
         * Toggle player.active
         */
        $scope.toggleActive = function(childScope){
            childScope.player.active = !childScope.player.active;
        };

        $scope.toggleShowAddPlayer = function(){
            $scope.showAddPlayer = !$scope.showAddPlayer;
        };

        $scope.addNewPlayer = function(name){
            players.add({
                name: name
            }).success(function (newPlayer){
                $scope.players.push(newPlayer);
                $scope.newPlayerName = '';
            }).error(function(err){
                console.log(err);
            });
        };

        /**
         * Run generateTeams() a bunch of times so it looks visually sweet
         */
        $scope.runTeamGenerator = function(){
            var loops = 20;
            var timeout = 30;
            var promise;
            for(var i = 0; i <loops; i++){
                promise = $timeout($scope.generateTeams, loops*timeout);
                timeout = timeout * 1.1;
            }
            promise.then(function(){
                $scope.gameReady = true;
            });
        };

        /**
         * Generate the teams
         */
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
