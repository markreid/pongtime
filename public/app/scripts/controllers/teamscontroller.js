(function(){
    'use strict';

    angular.module('pong').controller('teamsController', ['$scope', 'teams', function($scope, teamsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.getTeams();
            // set defaults here
        };

        /**
         * Call the players service to fetch players from the DB
         */
        $scope.getTeams = function(){
            return teamsService.getTeams().then(function(response){
                $scope.teams = response.data;
            }).catch(function(err){
                console.log('FUCK.');
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        $scope.reset();

    }]);
})();
