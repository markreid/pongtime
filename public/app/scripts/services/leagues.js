/**
 * User service
 */

(function(){
    'use strict';
    angular.module('pong').factory('leagues', ['$http', '$cookies', '$location', function($http, $cookies, $location){

        var registeredObservers = [];

        // defaults
        var synced = false;
        var leagues = [];

        /**
         * Constructor
         * fetches and parses the leagues from the API
         */
        var LeaguesService = function(){
            this.reset();
        };

        LeaguesService.prototype.reset = function(){
            return fetchLeagues().then(_.bind(function(leaguesArray){
                leagues = this.parseLeagues(leaguesArray);
                synced = true;
            }, this)).then(notifyObservers);
        };

        LeaguesService.prototype.getActiveLeague = function(){
            return _.find(leagues, function(league){
                return league.active;
            });
        };

        LeaguesService.prototype.getActiveLeagueId = function(){
            return $cookies.ptLeagueId || -1;
        };

        LeaguesService.prototype.setActiveLeague = function(id){
            $cookies.ptLeagueId = Number(id);
            this.reset();
        };

        // single league APi fetch
        LeaguesService.prototype.getLeagueDetail = function(id){
            return $http.get('/api/v1/leagues/' + id).then(function(response){
                return response.data;
            });
        };

        /**
         * Parse the leagues API response
         * The last-viewed league ID is stored in cookies
         * Use that to flag .active on one of the leagues
         * @param  {Array} leagues
         * @return {Array} parsed leagues
         */
        LeaguesService.prototype.parseLeagues = function(leagues){
            var cookieLeagueId = Number($cookies.ptLeagueId);

            // If the cookie was set to -1 or we weren't returned anything,
            // give an empty array.  The current user is unable to view
            // any leagues.
            if(cookieLeagueId === -1 || !leagues || !leagues.length){
                return [];
            }

            var returnLeagues = _.map(leagues, function(league){
                if(league.id === cookieLeagueId) league.active = true;
                return league;
            });
            return returnLeagues;
        };

        // API call
        function fetchLeagues (){
            return $http.get('/api/v1/leagues').then(function(response){
                return response.data;
            });
        }

        /**
         * Callback registered observers, passing leagues
         */
        function notifyObservers(){
            _.each(registeredObservers, function(callback){
                callback(leagues);
            });
        }

        /**
         * Register an observer callback, that will be notified whenever
         * the leagues are updated.  Calls back immediately if we've already
         * synced with the server.
         */
        LeaguesService.prototype.onUpdate = function(callback){
            registeredObservers.push(callback);
            if(synced) callback(leagues);
        };

        return new LeaguesService();

    }]);

})();
