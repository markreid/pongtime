(function(){
    'use strict';

    angular.module('pong').controller('gamesController', ['$scope', 'games', 'user', function($scope, gamesService, userService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.getGames();
        }

        userService.onUserUpdate(function(user){
            $scope.user = user;
        });

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
