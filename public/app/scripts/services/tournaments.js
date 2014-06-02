/**
 * tournaments service
 */

(function(){
    'use strict';

    angular.module('pong').factory('tournaments', ['$http', 'leagues', function($http, leaguesService){

        var TournamentsService = function(){};


        /**
         * Fetch all tournaments for the current league
         * @return {Array}
         */
        TournamentsService.prototype.getTournaments = function(){
            return $http.get(apiRoot()).then(function(response){
                return _.map(response.data, parseTournament);
            });
        };

        /**
         * Fetch a single tournament
         * @param  {Number} id
         * @return {Object}
         */
        TournamentsService.prototype.getTournament = function(id){
            return $http.get(apiRoot() + Number(id) + '/').then(function(response){
                return parseTournament(response.data);
            });
        };

        /**
         * Return all currently active tournaments
         * @return {Array}
         */
        TournamentsService.prototype.getActiveTournaments = function(){
            return this.getTournaments().then(function(tournaments){
                return _.where(tournaments, {complete:false});
            });
        };




        /**
         * Parse an API response to give us some extra data, human-readability, etc
         */
        function parseTournament(tournament){
            return tournament;
        }

        // return the tournaments API root by getting the current active league ID
        function apiRoot(){
            return '/api/v1/leagues/' + leaguesService.getActiveLeagueId() + '/tournaments/';
        }

        return new TournamentsService();

    }]);

})();
