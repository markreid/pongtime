(function(){
    'use strict';

    angular.module('pong').controller('playerDetailController', ['$scope', '$routeParams', 'players', 'notifications', function($scope, $routeParams, playersService, notificationsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            playersService.getPlayerDetailed($routeParams.id).then(function(player){
                $scope.player = player;
                $scope.hasBeenEdited = false;
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        $scope.save = function(){
            playersService.save($scope.player).then(function(player){
                $scope.player = player;
                $scope.hasBeenEdited = false;
            })
        };


        $scope.reset();

    }]);
})();
