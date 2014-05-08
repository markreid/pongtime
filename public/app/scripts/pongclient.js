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
        }).otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    });



})();

