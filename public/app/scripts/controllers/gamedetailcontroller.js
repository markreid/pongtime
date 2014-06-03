(function(){
    'use strict';

    angular.module('pong').controller('gameDetailController', ['$scope', '$routeParams', 'games', 'leagues', 'notifications', function($scope, $routeParams, gamesService, leaguesService, notificationsService){

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
        leaguesService.onFetch(function(leagues){
            $scope.league = _.find(leagues, function(league){
                return league.active;
            });
        });


        $scope.reset();

    }]);
})();
