(function(){
    'use strict';

    angular.module('pong').controller('leagueDetailController', ['$scope', '$routeParams', 'leagues', function($scope, $routeParams, leaguesService){

        $scope.reset = function(){
            $scope.refreshing = true;
            leaguesService.setActiveLeague($routeParams.id);
            getLeague($routeParams.id).then(function(league){
                $scope.league = league;
                $scope.stats = generateLeagueStats(league);
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        // hit the leaguesService
        function getLeague(id){
            return leaguesService.getLeagueDetail(id);
        }

        function generateLeagueStats(league){
            // team with most wins
            // team with highest win rate
            // team with most losses
            // team with lowest win rate
            // player with most wins
            // player with most losses

            var stats = [];
            return stats;


        }

        $scope.reset();

    }]);
})();
