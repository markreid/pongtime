(function(){
    'use strict';

    angular.module('pong').controller('teamDetailController', ['$scope', '$routeParams', 'teams', 'notifications', 'leagues', function($scope, $routeParams, teamsService, notificationsService, leaguesService){

        // todo - put the league on the root scope?
        leaguesService.onFetch(function(){
            $scope.league = leaguesService.getActiveLeague();
        });

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.showOpenGames = true;
            $scope.showPlayedGames = true;

            teamsService.getTeamWithDetails($routeParams.id).then(function(team){
                $scope.team = team;
                $scope.pageTitle = team.name;
                $scope.hasHave = team.players.length > 1 ? 'have' : 'has';
                $scope.hasBeenEdited = false;
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
            });
            teamsService.getTeamGames($routeParams.id).then(function(games){
                // todo - could put this in games service, it's duplicated in game list controller
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
            });
        };

        $scope.save = function(){
            teamsService.saveTeam($scope.team).then(function(team){

                $scope.team = team;
                $scope.pageTitle = team.name;
                $scope.hasBeenEdited = false;
            });
        };

        $scope.reset();

    }]);
})();
