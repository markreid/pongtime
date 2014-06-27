(function(){
    'use strict';

    angular.module('pong').controller('teamsController', ['$scope', '$routeParams', 'teams', 'notifications', 'leagues', function($scope, $routeParams, teamsService, notificationsService, leaguesService){

        // todo - should we just put the league on the root scope?
        leaguesService.onFetch(function(){
            $scope.league = leaguesService.getActiveLeague();
        });

        $scope.reset = function(){
            $scope.refreshing = true;

            if($routeParams.id){
                $scope.getOneTeam($routeParams.id);
            } else {
                $scope.getAllTeams();
            }

        };

        /**
         * Call the players service to fetch players from the DB
         */
        $scope.getAllTeams = function(){
            return teamsService.getTeams().then(function(teams){
                $scope.teams = teams;
                $scope.predicate = ['-stat.points'];
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
                $scope.pageTitle = 'Teams';
            });
        };

        $scope.getOneTeam = function(id){
            return teamsService.getTeam(id).then(function(team){
                $scope.team = team;
                $scope.pageTitle = team.name;
                $scope.hasHave = team.players.length > 1 ? 'have' : 'has';
                $scope.hasBeenEdited = false;
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
            })
        };

        $scope.reset();

    }]);
})();
