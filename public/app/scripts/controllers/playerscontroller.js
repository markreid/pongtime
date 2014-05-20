(function(){
    'use strict';

    angular.module('pong').controller('playersController', ['$scope', '$routeParams', 'players', 'notifications', function($scope, $routeParams, playersService, notificationsService){

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
                $scope.predicate = ['-stat.winPercentage', '-stat.wins'];
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        function getOnePlayer(id){
            return playersService.getPlayer(id).then(function(player){
                $scope.player = player;
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
