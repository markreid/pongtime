(function(){
    'use strict';

    angular.module('pong').controller('tournamentDetailController', ['$scope', '$routeParams', 'tournaments', function($scope, $routeParams, tournamentsService){

        $scope.reset = function(){
            $scope.refreshing = true;

            tournamentsService.getTournament($routeParams.id).then(function(tournament){
                $scope.tournament = tournament;
            }).catch(function(err){
                // todo - generic error handler
            }).finally(function(){
                $scope.refreshing = false;
            });

        };

        $scope.reset();


    }]);
})();
