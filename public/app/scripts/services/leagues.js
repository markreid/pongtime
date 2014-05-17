/**
 * User service
 */

(function(){
    'use strict';

    angular.module('pong').factory('leagues', ['$http', '$rootScope', function($http, $rootScope){

        var registeredObservers = [];

        // defaults
        var leagues = [];
        var activeLeague = {};

        // When we initialize, we need to fetch the available leagues.
        // if there was an active league in the session, the API will
        // return one with .active

        var LeaguesService = function(){
            this.getLeagues().then(function(leaguesArray){
                leagues =leaguesArray;
                activeLeague = _.find(leagues, function(league){
                    return league.active === true;
                });

            }).then(this.notifyObservers);
        };

        // api call
        LeaguesService.prototype.getLeagues = function(){
            return $http.get('/api/v1/leagues').then(function(response){
                return response.data;
            });
        };

        LeaguesService.prototype.notifyObservers = function(){
            _.each(registeredObservers, function(callback){
                callback(leagues, activeLeague);
            });
        };

        /**
         * Register an observer callback and call it back straight away.
         * @return {[type]}            [description]
         */
        LeaguesService.prototype.onLeaguesFetch = function(callback){
            registeredObservers.push(callback);
            callback(leagues);
        };

        return new LeaguesService();

    }]);

})();
