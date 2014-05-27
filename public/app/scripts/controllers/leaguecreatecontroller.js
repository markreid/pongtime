(function(){
    'use strict';

    angular.module('pong').controller('leagueCreateController', ['$scope', 'leagues', 'notifications', function($scope, leaguesService, notificationsService){

        $scope.reset = function(){
            $scope.league = {
                name: '',
                public: null
            };
            $scope.saving = false;
            $scope.refreshing = false;
        }

        $scope.addLeague = function(){
            $scope.saving = true;

            leaguesService.create($scope.league).then(function(league){
                $scope.league = league;
                $scope.successful = true;
            }).catch(function(err){
                if(err.status === 403){
                    notificationsService.unauthorised();
                } else {
                    notificationsService.generic();
                    console.log(err);
                }
            }).finally(function(){
                $scope.saving = false;
            });

        };

        $scope.reset();

    }]);
})();
