(function(){
    'use strict';

    angular.module(['pong'], ['ngCookies', 'ngResource', 'ngSanitize', 'ngRoute', 'ngQuickDate'])
    .config(function($routeProvider, $locationProvider){
        $routeProvider.when('/', {
            templateUrl: '/static/views/indexview.html',
            controller: 'indexController'
        }).when('/games', {
            templateUrl: '/static/views/gamesview.html',
            controller: 'gamesController'
        }).when('/teams', {
            templateUrl: '/static/views/teamlistview.html',
            controller: 'teamsController'
        }).when('/teams/:id', {
            templateUrl: '/static/views/teamdetailview.html',
            controller: 'teamDetailController'
        }).when('/players', {
            templateUrl: '/static/views/playerlistview.html',
            controller: 'playersController'
        }).when('/players/:id', {
            templateUrl: '/static/views/playerdetailview.html',
            controller: 'playerDetailController'
        }).when('/leagues/new', {
            templateUrl: '/static/views/leaguecreateview.html',
            controller: 'leagueCreateController'
        }).when('/leagues/:id', {
            templateUrl: '/static/views/leaguedetailview.html',
            controller: 'leagueDetailController'
        }).otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    }).filter('plural', function(){
        // a super dodgy plural filter. use like this:
        // {{ 'some thing' | plural:count:'some things'}}
        return function(singular, count, plural){
            if(!_.isNaN(count) && Number(count) === 0 || Number(count) > 1){
                return plural || singular + 's';
            } else {
                return singular;
            }
        }
    }).filter('capitalize', function(){
        // capitalize the first letter of a string.
        return function(word){
            if(!word) return;
            return word.substr(0,1).toUpperCase() + word.substr(1)
        }
    });


})();

