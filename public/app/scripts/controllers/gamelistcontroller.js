(function(){
    'use strict';

    angular.module('pong').controller('gameListController', ['$scope', 'games', 'comps', 'notifications', function($scope, gamesService, compsService, notificationsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.showOpenGames = true;
            $scope.showPlayedGames = true;
            $scope.allGames = [];
            $scope.openGames = [];
            $scope.playedGames = [];
            $scope.getGames();
        }

        // todo - is it safer just to look at root scope?
        compsService.onFetch(function(comps){
            $scope.comp = _.find(comps, function(comp){
                return comp.active;
            });
        });

        /**
         *
         */
        $scope.getGames = function(){
            return gamesService.getGames().then(function(games){
                $scope.allGames = games;
                $scope.openGames = [];
                $scope.playedGames = [];
                _.each($scope.allGames, function(game){
                    if(game.winningTeamId){
                        $scope.playedGames.push(game);
                    } else {
                        $scope.openGames.push(game);
                    }
                });

            }).catch(function(err){
                notificationsService.generic();
            }).finally(function(){
                $scope.refreshing = false;
                $scope.pageTitle = 'Games: ' + $scope.comp.name;
            });
        };

        $scope.reset();

    }]);
})();
