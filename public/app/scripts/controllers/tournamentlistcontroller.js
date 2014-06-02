(function(){
    'use strict';

    angular.module('pong').controller('tournamentListController', ['$scope', 'tournaments', function($scope, tournamentsService){

        $scope.reset = function(){
            $scope.refreshing = true;

            tournamentsService.getTournaments().then(function(tournaments){
                $scope.tournaments = tournaments;

                $scope.activeTournaments = _.where(tournaments, {complete:false});
                $scope.closedTournaments = _.where(tournaments, {complete:true});
            }).catch(function(err){
                // todo - generic error handler
            }).finally(function(){
                $scope.refreshing = false;
            });

        };

        $scope.reset();


    }]);
})();
