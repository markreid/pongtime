(function(){
    'use strict';

    angular.module('pong').controller('teamDetailController', ['$scope', '$routeParams', 'teams', 'notifications', function($scope, $routeParams, teamsService, notificationsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            teamsService.getTeamWithDetails($routeParams.id).then(function(team){
                $scope.team = team;
                $scope.pageTitle = team.name;
                $scope.hasHave = team.players.length > 1 ? 'have' : 'has';
                $scope.hasBeenEdited = false;
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        $scope.save = function(){
            teamsService.saveTeam($scope.team).then(function(team){
                $scope.team = team;
                $scope.pageTitle = team.name;
                $scope.hasBeenEdited = false;
            });
        };

        $scope.reset();

    }]);
})();
