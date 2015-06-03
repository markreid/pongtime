(function(){
    'use strict';

    angular.module('pong').controller('teamsController', ['$scope', '$routeParams', 'teams', 'notifications', 'comps', function($scope, $routeParams, teamsService, notificationsService, compsService){

        $scope.reset = function(){
            $scope.refreshing = true;

            if($routeParams.id){
                $scope.getOneTeam($routeParams.id);
            } else {
                // get the current comp (if any) then fetch all teams
                compsService.getCurrentComp().then(function(comp){
                    $scope.comp = comp;
                    $scope.getAllTeams(comp.id);
                });
            }

        };

        /**
         * Call the teams service to fetch players from the DB
         * @param {String} compID
         */
        $scope.getAllTeams = function(compID){
            return teamsService.getTeams(compID).then(function(teams){
                $scope.teams = teams;
                $scope.predicate = ['-stat.winPercentage', '-stat.wins'];
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
                $scope.pageTitle = 'Teams: ' + $scope.comp.name;
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
