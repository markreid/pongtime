(function(){
    'use strict';

    angular.module('pong').controller('gameListController', ['$scope', 'games', 'leagues', 'notifications', function($scope, gamesService, leaguesService, notificationsService){

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
        leaguesService.onFetch(function(leagues){
            $scope.league = _.find(leagues, function(league){
                return league.active;
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
            });
        };

        $scope.reset();

    }]);
})();
