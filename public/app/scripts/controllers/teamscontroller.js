(function(){
    'use strict';

    angular.module('pong').controller('teamsController', ['$scope', '$routeParams', 'teams', function($scope, $routeParams, teamsService){
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
            }).catch(function(err){
                console.log('FUCK.');
            }).finally(function(){
                $scope.refreshing = false;
                $scope.pageTitle = 'Teams';
            });
        };

        $scope.getOneTeam = function(id){
            return teamsService.getTeam(id).then(function(team){
                $scope.teams = [team];
                $scope.pageTitle = team.name;
            }).catch(function(err){
                //todo - handle
            }).finally(function(){
                $scope.refreshing = false;
            })
        };

        $scope.reset();

    }]);
})();
