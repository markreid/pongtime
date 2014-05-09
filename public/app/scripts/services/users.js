/**
 * users service
 */

(function(){
    'use strict';

    angular.module('pong').factory('users', ['$http', function($http){

        var UsersService = function(){};

        UsersService.prototype.getCurrentUser = function(){
            return $http.get('/api/v1/user/').then(function(response){
                return response.data;
            });
        };

        return new UsersService();

    }]);

})();
