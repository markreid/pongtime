/**
 * User service
 */

(function(){
    'use strict';

    angular.module('pong').factory('user', ['$http', '$q', '$rootScope', function($http, $q, $rootScope){

        /**
         * There are a whole heap of places where we want to know whether the user
         * is logged in, and whether they have the authority to do certain actions.
         * This service provides an observer pattern, via which controllers can be
         * informed of changes to the user object.
         */

        var registeredObservers = [];

        // defaults
        var user = parseUser({});

        var UsersService = function(){
            this.refreshUser();
        };

        UsersService.prototype.refreshUser = function(){
            this.getCurrentUser().then($.proxy(function(userData){
                user = parseUser(userData);
                this.notifyObservers();
            }, this));
        };

        UsersService.prototype.notifyObservers = function(){
            _.each(registeredObservers, function(callback){
                callback(user);
            });
        };

        // API call
        UsersService.prototype.getCurrentUser = function(){
            return $http.get('/api/v1/user/').then(function(response){
                return response.data;
            });
        };

        /**
         * Register an observer callback and call it back straight away.
         * @return {[type]}            [description]
         */
        UsersService.prototype.onUserUpdate = function(callback){
            registeredObservers.push(callback);
            callback(user);
        };


        UsersService.prototype.getUsers = function(){
            return $http.get('/api/v1/users/').then(function(response){
                return response.data;
            });
        };

        function parseUser(user){
            if(!user) user = {};
            user.isAdmin = user.auth > 2;
            user.signedIn = !!user.id;
            return user;
        };

        return new UsersService();

    }]);

})();
