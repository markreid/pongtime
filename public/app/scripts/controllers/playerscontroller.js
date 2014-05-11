(function(){
    'use strict';

    angular.module('pong').controller('playersController', ['$scope', '$routeParams', 'players', function($scope, $routeParams, playersService){

        $scope.reset = function(){
            $scope.refreshing = true;

            if($routeParams.id){
                getOnePlayer($routeParams.id);
            } else {
                getPlayers();
            }

        };

        /**
         * Call the players service to fetch players from the DB
         */
        function getPlayers(){
            return playersService.getPlayers().then(function(players){
                $scope.players = players;
            }).catch(function(err){
                console.log('FUCK.');
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        function getOnePlayer(id){
            return playersService.getPlayer(id).then(function(player){
                $scope.player = player;
            }).catch(function(err){
                throw err;
            }).finally(function(){
                $scope.refreshing = false;
            })
        };

        $scope.reset();

    }]);
})();
