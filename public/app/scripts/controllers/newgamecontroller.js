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
            $scope.showAddPlayer = false;
	        $scope.warning = false;
            $scope.activeTeams = [];


            // fetch everything we need
            $scope.getTeams().finally(function(){
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
         * Get the teams list from the DB
         */
        $scope.getTeams = function(){
            return teamsService.getTeams().then(function(teams){
                $scope.teams = teams;
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            });
        };

        /**
         * Add a new team
         * @type {String}
         */
        $scope.addNewTeam = function(teamName){
            return teamsService.addTeam(teamName).then(function(team){
                $scope.teams.push(team);
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            });
        };

        $scope.addTeamToGame = function(teamId){
            teamId = Number(teamId);
            // check for NaN and fail

            var teamObject = _.findWhere($scope.teams, {id:teamId});

            $scope.activeTeams.unshift(teamObject);
            $scope.activeTeams.splice(2);

            $scope.teamsReady = ($scope.activeTeams.length === 2);

        };

        // /**
        //  * Generate the teams
        //  */
        // $scope.generateTeams = function(){
	       // $scope.warning = false;
        //     var allPlayers = $scope.players.slice();
        //     var players = _.filter(allPlayers, function(player){
        //         return player.active
        //     });
        //     var numTeams = Number($scope.numTeams);
        //     var playersPerTeam = Number($scope.playersPerTeam);
        //     var numPlayers = numTeams * playersPerTeam;

        //     if(players.length < numPlayers){
        //         $scope.warning = 'There\'s not enough players for that many teams.';
        //         return false;
        //     }

        //     // first reduce it to the number of players we need
        //     while(players.length > numPlayers){
        //         spliceRandom(players);
        //     }

        //     // now make the teams
        //     var teams = [];
        //     teams.push([]);
        //     while(players.length){
        //         var newestTeam = teams[teams.length-1];
        //         var player = spliceRandom(players)[0];
        //         newestTeam.push(player);

        //         if(newestTeam.length === playersPerTeam && players.length){
        //             teams.push([]);
        //         }
        //     }

        //     // map it into a reasonable format
        //     // todo - inefficient, too many loops
        //     var teams = _.map(teams, function(playersArray){
        //         return {
        //             players: _.map(playersArray, function(player){
        //                 return {
        //                     id: player.id,
        //                     name: player.name,
        //                 }
        //             }),
        //             playerIds: _.pluck(playersArray, 'id'),
        //             playerNames: _.pluck(playersArray, 'name').join(' and ')
        //         }
        //     });

        //     // clear the teams and call a $digest before setting the new teams.
        //     // this ensures we get new instances of the teamwidget directive every time.
        //     $scope.teams = [];
        //     $scope.$digest();
        //     $scope.teams = teams;
        // };

        var spliceRandom = function(arr){
            var random = Math.floor(Math.random() * arr.length);
            return arr.splice(random, 1);
        }

        $scope.reset();

    }]);
})();
