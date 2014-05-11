(function(){
    'use strict';

    angular.module(['pong'], ['ngCookies', 'ngResource', 'ngSanitize', 'ngRoute'])
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
        }).when('/teams/:id/', {
            templateUrl: '/static/views/teamdetailview.html',
            controller: 'teamsController'
        }).otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    }).filter('plural', function(){
        // a super dodgy plural filter.
        // use like this:
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

