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
            return teamsService.getTeams().then(function(response){
                $scope.teams = response.data;
            }).catch(function(err){
                console.log('FUCK.');
            }).finally(function(){
                $scope.refreshing = false;
                $scope.pageTitle = 'Teams';
            });
        };

        $scope.getOneTeam = function(id){
            return teamsService.getTeam(id).then(function(response){
                $scope.teams = [response.data];
                $scope.pageTitle = response.data.name;
            }).catch(function(err){
                //todo - handle
            }).finally(function(){
                $scope.refreshing = false;
            })
        };

        $scope.reset();

    }]);
})();
