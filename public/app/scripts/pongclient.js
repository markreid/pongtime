(function(){
    'use strict';

    angular.module(['pong'], ['ipCookie', 'ngResource', 'ngSanitize', 'ngRoute', 'ngQuickDate', 'localytics.directives'])
    .config(function($routeProvider, $locationProvider){

        // configure the route provider
        $routeProvider.when('/', {
            templateUrl: '/static/views/indexview.html',
            controller: 'indexController'
        }).when('/newgame', {
            templateUrl: '/static/views/newgameview.html',
            controller: 'newGameController'
        }).when('/games', {
            templateUrl: '/static/views/gamelistview.html',
            controller: 'gameListController'
        }).when('/games/:id', {
            templateUrl: '/static/views/gamedetailview.html',
            controller: 'gameDetailController'
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
        }).when('/leagues', {
            templateUrl: '/static/views/leaguelistview.html',
            controller: 'leagueListController'
        }).when('/leagues/new', {
            templateUrl: '/static/views/leaguecreateview.html',
            controller: 'leagueCreateController'
        }).when('/leagues/:id', {
            templateUrl: '/static/views/leaguedetailview.html',
            controller: 'leagueDetailController'
        }).otherwise({
            redirectTo: '/'
        });

        // configure the location provider
        $locationProvider.html5Mode(true);

    }).run(function(ipCookie, $location){

        // Redirect to the leagues list if the user hasn't selected a league yet
        if(!ipCookie('ptLeagueId')) $location.path('/s');

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

