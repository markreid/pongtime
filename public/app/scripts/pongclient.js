(function(){

    'use strict';
    angular.module(['pong'], ['ngCookies', 'ngResource', 'ngSanitize', 'ngRoute'])
    .config(function($routeProvider, $locationProvider){
        $routeProvider.when('/', {
            templateUrl: '/static/views/index.html',
            controller: 'indexController'
        }).otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    });



})();

