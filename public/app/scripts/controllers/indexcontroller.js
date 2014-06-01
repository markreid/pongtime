(function(){
    'use strict';

    angular.module('pong').controller('indexController', ['$scope', '$routeParams', '$cookies', 'leagues', function($scope, $routeParams, $cookies, leaguesService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.noLeagueSelected = !!($cookies.ptLeagueId);
            leaguesService.getLeagues().then(function(leagues){
                $scope.leagues = leagues;
            }).finally(function(){
                $scope.refreshing = false;
            });

        };

        $scope.reset();


    }]);
})();
