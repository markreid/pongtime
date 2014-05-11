(function(){
    'use strict';

    angular.module('pong').controller('gamesController', ['$scope', 'games', function($scope, gamesService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.getGames();
            // set defaults here

        };

        /**
         *
         */
        $scope.getGames = function(){
            return gamesService.getGames().then(function(games){
                $scope.games = games;
            }).catch(function(err){
                console.log('FUCK.');
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        $scope.reset();

    }]);
})();
