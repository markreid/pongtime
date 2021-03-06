(function(){
    'use strict';

    angular.module('pong').controller('indexController', ['$scope', '$routeParams', 'ipCookie', 'comps', function($scope, $routeParams, ipCookie, compsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            $scope.noCompSelected = !!(ipCookie('ptCompId'));
            compsService.getComps().then(function(comps){
                $scope.comps = comps;
            }).finally(function(){
                $scope.refreshing = false;
            });

        };

        $scope.reset();


    }]);
})();
