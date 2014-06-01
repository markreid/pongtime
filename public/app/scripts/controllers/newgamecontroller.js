(function(){
    'use strict';

    angular.module('pong').controller('newGameController', ['$scope', '$timeout', '$q', 'players', 'teams', 'notifications', 'user', 'leagues', function($scope, $timeout, $q, playersService, teamsService, notificationsService, userService, leaguesService){

        /**
         * This controller has a kind-of complicated workflow, so here's a little description:
         *
         * 1. Fetch players from the DB.
         * 2. Button click generates teams by randomising and splicing together players as needed (ie, 2 vs 2)
         * 3. Teams are passed to a creategame widget
         * 4. Creategame widget passes each team to a teamwidget, which hits the API to find the teams
         * 5. If the teams exist, creategame widget fetches stats and head-to-head results
         * 6. Teams are passed UP the scope from their teamwidgets back to the creategame widget
         * 7. Button click generates the game, displays in a gamewidget.
         *
         */

        $scope.reset = function(){
            $scope.refreshing = true;

            // set defaults
            $scope.numTeams = 2;
            $scope.playersPerTeam = 2;
            $scope.showAddPlayer = false;
	        $scope.warning = false;


            // fetch everything we need
            $scope.getPlayers().finally(function(){
                $scope.refreshing = false;
            });

        };

        // attach the active league to the scope
        leaguesService.onFetch(function(leagues){
            $scope.league = _.find(leagues, function(league){
                return league.active;
            });
        });


        /**
         * Call the players service to fetch players from the DB
         */
        $scope.getPlayers = function(){
            return playersService.getPlayers().then(function(players){
                $scope.players = _.map(players, function(player){
                    return _.extend(player, {active:true});
                });
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            });
        };

        /**
         * Toggle player.active
         */
        $scope.toggleActive = function(childScope){
            childScope.player.active = !childScope.player.active;
        };

        $scope.addNewPlayer = function(name){
            playersService.add({
                name: name,
                leagueId: leaguesService.getActiveLeagueId()
            }).then(function (newPlayer){
                newPlayer.active = true;
                $scope.players.push(newPlayer);
                $scope.newPlayerName = '';
            }).catch(function(err){
                if(err.status === 403){
                    // no permissions
                    notificationsService.unauthorised();
                } else {
                    notificationsService.generic();
                    console.log(err);
                }
            });
        };

        /**
         * Run generateTeams() a bunch of times so it looks visually sweet
         */
        $scope.runTeamGenerator = function(){
            var loops = 1;
            var timeout = 0;
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
	       $scope.warning = false;
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

            // map it into a reasonable format
            // todo - inefficient, too many loops
            var teams = _.map(teams, function(playersArray){
                return {
                    players: _.map(playersArray, function(player){
                        return {
                            id: player.id,
                            name: player.name,
                        }
                    }),
                    playerIds: _.pluck(playersArray, 'id'),
                    playerNames: _.pluck(playersArray, 'name').join(' and ')
                }
            });

            // clear the teams and call a $digest before setting the new teams.
            // this ensures we get new instances of the teamwidget directive every time.
            $scope.teams = [];
            $scope.$digest();
            $scope.teams = teams;
        };

        var spliceRandom = function(arr){
            var random = Math.floor(Math.random() * arr.length);
            return arr.splice(random, 1);
        }

        $scope.reset();

    }]);
})();
