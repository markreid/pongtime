(function(){
    'use strict';

    angular.module('pong').controller('indexController', ['$scope', '$routeParams', 'ipCookie', 'leagues', function($scope, $routeParams, ipCookie, leaguesService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.noLeagueSelected = !!(ipCookie('ptLeagueId'));
            leaguesService.getLeagues().then(function(leagues){
                $scope.leagues = leagues;
            }).finally(function(){
                $scope.refreshing = false;
            });

        };

        $scope.reset();


    }]);
})();
