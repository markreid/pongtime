(function(){
    'use strict';

    angular.module('pong').controller('compCreateController', ['$scope', 'comps', 'notifications', function($scope, compsService, notificationsService){

        $scope.reset = function(){
            $scope.comp = {
                name: '',
                public: false
            };
            $scope.saving = false;
            $scope.refreshing = false;
        }

        $scope.addComp = function(){
            $scope.saving = true;

            compsService.create($scope.comp).then(function(comp){
                $scope.comp = comp;
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
