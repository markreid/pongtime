/**
 * Comps service
 */

(function(){
    'use strict';
    angular.module('pong').factory('comps', ['$http', 'ipCookie', '$location', '$routeParams', '$q', 'user', function($http, ipCookie, $location, $routeParams, $q, usersService){

        var registeredObservers = [];

        // defaults
        var synced = false;
        var comps = [];
        var user = null;

        // the dummy comp
        var globalComp = {
            id: 0,
            name: 'Free play (no comp)'
        };

        /**
         * Constructor
         * fetches and parses the comps from the API
         */
        var CompsService = function(){
            usersService.onUserUpdate(function(fetchedUser){
                user = fetchedUser;
            });
            this.reset();
        };

        CompsService.prototype.reset = function(){
            return fetchComps().then(_.bind(function(compsArray){
                comps = this.parseComps(compsArray);
                synced = true;
            }, this)).then(notifyObservers);
        };

        /**
         * Get all comps from the API (wraps getComps)
         * @type {promise}
         */
        CompsService.prototype.getComps = function(){
            return fetchComps();
        };

        /**
         * Returns the cache of the comps, hitting the API if there's no cache
         * @type {promise}
         */
        CompsService.prototype.getCompsCached = function(){
            var dfd = $q.defer();

            if(synced){
                dfd.resolve(comps);
            } else {
                fetchComps().then(function(comps){
                    dfd.resolve(comps);
                }).catch(function(err){
                    dfd.reject(err);
                });
            }

            return dfd.promise;
        };

        // todo - think this can be deprecated
        CompsService.prototype.getActiveComp = function(){
            console.log('checking url for active comp');
            console.log($routeParams.compID);
            return _.find(comps, function(comp){
                return comp.active;
            });
        };

        /**
         * Fetch all the comps from the API (check cache first)
         * Find the comp matching the current url, falling back to the default
         * @type {promise} resolves to comp object
         */
        CompsService.prototype.getCurrentComp = function(){
            var urlCompId = ($routeParams.compID && Number($routeParams.compID)) || 0;

            return this.getCompsCached().then(function(comps){
                return _.findWhere(comps, {id: urlCompId }) || globalComp;
            });
        };

        // single comp API fetch
        CompsService.prototype.getCompDetail = function(id){
            return $http.get('/api/v1/comps/' + id).then(function(response){
                return response.data;
            });
        };

        CompsService.prototype.save = function(compData){
            var validFields = ['name', 'public', 'membersAreMods', 'members', 'moderators'];
            var validData = _.pick(compData, validFields);
            return $http.put('/api/v1/comps/' + compData.id + '/', validData).then(function(response){
                return response.data;
            });
        };

        CompsService.prototype.create = function(compData){
            var validFields = ['name', 'public'];
            var validData = _.pick(compData, validFields);
            return $http.post('/api/v1/comps/', validData).then(function(response){
                return response.data;
            });
        };

        /**
         * Parse the comps API response
         * The last-viewed comp ID is stored in cookies
         * Use that to flag .active on one of the comps
         * @param  {Array} comps
         * @return {Array} parsed comps
         */
        CompsService.prototype.parseComps = function(comps){
            var cookieCompId = Number(ipCookie('ptCompId'));

            // If the cookie was set to -1 or we weren't returned anything,
            // give an empty array.  The current user is unable to view
            // any comps.
            if(cookieCompId === -1 || !comps || !comps.length){
                return [];
            }

            var returnComps = _.map(comps, function(comp){
                if(comp.id === cookieCompId) comp.active = true;
                comp.writable = isWritable(comp);
                return comp;
            });
            return returnComps;
        };


        /**
         * Fetch all the comps from the API
         * @return {promise}
         */
        function fetchComps (){
            return $http.get('/api/v1/comps').then(function(response){
                return response.data;
            });
        }

        /**
         * Callback registered observers, passing comps
         */
        function notifyObservers(){
            _.each(registeredObservers, function(callback){
                callback(comps);
            });
        }

        /**
         * Return whether the current user can write to this comp
         */
        function isWritable(comp){
            if(!user) return false;
            if(user.isAdmin) return true;
            var compModerators = _.pluck(comp.moderators, 'id');
            return !!~compModerators.indexOf(user.id);
        }

        /**
         * Register an observer callback, that will be notified whenever
         * the comps are updated.  Calls back immediately if we've already
         * synced with the server.
         */
        CompsService.prototype.onFetch = function(callback){
            registeredObservers.push(callback);
            if(synced) callback(comps);
        };

        return new CompsService();

    }]);

})();
