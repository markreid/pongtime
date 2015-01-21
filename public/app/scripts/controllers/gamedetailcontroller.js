(function(){
    'use strict';

    angular.module('pong').controller('gameDetailController', ['$scope', '$routeParams', 'games', 'comps', 'notifications', function($scope, $routeParams, gamesService, compsService, notificationsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            gamesService.getGame($routeParams.id).then(function(game){
                $scope.game = game;
            }).catch(function(err){
                notificationsService.generic(err);
            }).finally(function(){
                $scope.refreshing = false;
            });
        }

        // todo - is it safer just to look at root scope?
        compsService.onFetch(function(comps){
            $scope.comp = _.find(comps, function(comp){
                return comp.active;
            });
        });


        $scope.reset();

    }]);
})();
