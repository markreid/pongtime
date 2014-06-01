/**
 * Leagues service
 */

(function(){
    'use strict';
    angular.module('pong').factory('leagues', ['$http', 'ipCookie', '$location', 'user', function($http, ipCookie, $location, usersService){

        var registeredObservers = [];

        // defaults
        var synced = false;
        var leagues = [];
        var user = null;

        /**
         * Constructor
         * fetches and parses the leagues from the API
         */
        var LeaguesService = function(){
            usersService.onUserUpdate(function(fetchedUser){
                user = fetchedUser;
            });
            this.reset();
        };

        LeaguesService.prototype.reset = function(){
            return fetchLeagues().then(_.bind(function(leaguesArray){
                leagues = this.parseLeagues(leaguesArray);
                synced = true;
            }, this)).then(notifyObservers);
        };

        LeaguesService.prototype.getLeagues = function(){
            return fetchLeagues();
        };

        LeaguesService.prototype.getActiveLeague = function(){
            return _.find(leagues, function(league){
                return league.active;
            });
        };

        LeaguesService.prototype.getActiveLeagueId = function(){
            return ipCookie('ptLeagueId') || -1;
        };

        LeaguesService.prototype.setActiveLeague = function(id){
            ipCookie('ptLeagueId', Number(id), {path:'/', expires: 7});
            this.reset();
        };

        // single league API fetch
        LeaguesService.prototype.getLeagueDetail = function(id){
            return $http.get('/api/v1/leagues/' + id).then(function(response){
                return response.data;
            });
        };

        LeaguesService.prototype.save = function(leagueData){
            var validFields = ['name', 'public', 'membersAreMods', 'members', 'moderators'];
            var validData = _.pick(leagueData, validFields);
            return $http.put('/api/v1/leagues/' + leagueData.id + '/', validData).then(function(response){
                return response.data;
            });
        };

        LeaguesService.prototype.create = function(leagueData){
            var validFields = ['name', 'public'];
            var validData = _.pick(leagueData, validFields);
            return $http.post('/api/v1/leagues/', validData).then(function(response){
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
            var cookieLeagueId = Number(ipCookie('ptLeagueId'));

            // If the cookie was set to -1 or we weren't returned anything,
            // give an empty array.  The current user is unable to view
            // any leagues.
            if(cookieLeagueId === -1 || !leagues || !leagues.length){
                return [];
            }

            var returnLeagues = _.map(leagues, function(league){
                if(league.id === cookieLeagueId) league.active = true;
                league.writable = isWritable(league);
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
         * Return whether the current user can write to this league
         */
        function isWritable(league){
            if(!user) return false;
            if(user.isAdmin) return true;
            var leagueModerators = _.pluck(league.moderators, 'id');
            return !!~leagueModerators.indexOf(user.id);
        }

        /**
         * Register an observer callback, that will be notified whenever
         * the leagues are updated.  Calls back immediately if we've already
         * synced with the server.
         */
        LeaguesService.prototype.onFetch = function(callback){
            registeredObservers.push(callback);
            if(synced) callback(leagues);
        };

        return new LeaguesService();

    }]);

})();
