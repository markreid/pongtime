/**
 * Directives
 */

(function(){
    'use strict';

    angular.module('pong').directive('teamwidget', ['teams', 'notifications', function(teamsService, notificationsService){

        /**
         * Team widget
         * Displays basic information about a team
         * and allows quick editing of its properties.
         */

        return {
            templateUrl: '/static/views/teamwidget.html',
            restrict: 'E',
            scope: {
                team: '=team',
                playerIds: '=?playerIds',
                teamId: '=?teamId',
                playerNames: '@playerNames'
            },
            link: function($scope, $el, $attrs){

                /**
                 * Widget data can be populated in three ways:
                 * 1.   Team data is provided via `teams` attribute
                 * 2.   Player IDs are provided via `player-ids` attribute and we hit
                 *      the teams API.
                 * 3.   Team ID is provided via `team-id` attribute and we hit the API.
                 *
                 * the `team` attribute has two-way binding to the parent scope, so we can pass teams
                 * back to the parent after a fetch.
                 */

                 // configure default scope properties
                $scope.exists = null;

                /**
                 * Parse properties passed to the directive via scope attributes
                 * and hit the API where necessary
                 */
                function parseDataFromAttributes(){
                    if($scope.team && $scope.team.id){
                        // we've been given the team data directly, there's nothing to fetch.
                        fetchHandler($scope.team);
                        return;
                    }
                    if($scope.playerIds){
                        // we were passed player IDs. hit the team API to find a matching team.
                        teamsService.getTeamByPlayers($scope.playerIds).then(fetchHandler).catch(fetchErrorHandler);
                        return;
                    }
                    if($scope.teamId){
                        // we were passed a team ID, fetch it via the API.
                        teamsService.getTeam($scope.teamId).then(fetchHandler).catch(fetchErrorHandler);
                        return;
                    }
                }

                function fetchHandler(team){
                    team.playerIds = _.pluck(team.players, 'id');
                    $scope.team = team;
                    $scope.exists = true;
                    $scope.fetching = false;
                    $el.trigger('pongTeamWidgetSync');
                }

                function fetchErrorHandler(err){
                    // a 404 means the team doesn't exist
                    if(err.status === 404){
                        $scope.fetching = false;
                        $scope.exists = false;
                        $el.trigger('pongTeamWidgetSync');
                        return;
                    }

                    // generic error
                    notificationsService.generic();
                    console.log(err);
                }

                function reset(){
                    $scope.fetching = true;
                    parseDataFromAttributes();
                }

                $scope.toggleDetailedStats = function(){
                    $scope.showDetailedStats = !$scope.showDetailedStats;
                }

                reset();

            }
        }
    }]).directive('creategame', ['teams', 'games', 'notifications', '$q', function(teamsService, gamesService, notificationsService, $q){
        return {
            templateUrl: '/static/views/creategamewidget.html',
            restrict: 'E',
            scope: {
                teams: '=teams'
            },
            link: function($scope, $el, $attrs){

                /**
                 * The widget will be passed team data through the `teams` attribute.
                 * If the teams don't have an ID attribute, we need to fetch them from the server.
                 */

                /**
                 * Reset scope to initial state.
                 */
                $scope.reset = function(){
                    $scope.teamsReady = false;
                    $scope.readyTeamWidgetCount = 0;
                    $scope.stats = {};
                    $scope.showStats = false;
		            $scope.noStats = false;
                    $scope.createdGame = null;
                };

                // If the teams change, call a reset.
                // This change can come from the parent scope or a child scope (teamwidgets)
                $scope.$watch('teams', $scope.reset);

                // if both team widgets are ready, try and fetch the game stats
                $scope.$watch('readyTeamWidgetCount', function(val){
                    if(val === 2){
                        $scope.teamsReady = true;
                        // todo - what's the proper approach here?
			            setTimeout(fetchGameStats, 0);
                    }
                });

                $el.on('pongTeamWidgetSync', function(){
                    $scope.readyTeamWidgetCount++;
                });


                /**
                 * Fetch the head-to-head history of these two teams.
                 * @return {[type]} [description]
                 */
                var fetchGameStats = function(){
                    // silent failure if we don't have a team ID for each team (ie, they're new)
                    var teamIds = _.pluck($scope.teams, 'id');
                    if(teamIds.length !== 2 || ~teamIds.indexOf(undefined)) return;

                    gamesService.getGameStats(teamIds).then(function(stats){
                        if(!stats){
                            $scope.stats = {};
                            $scope.showStats = false;
			                $scope.noStats = true;
                            return;
                        }

                        // clean up the streak
                        var streakNames = _.map(stats.streak, function(winner){
                            if(winner === teamIds[0]) return $scope.teams[0].name;
                            if(winner === teamIds[1]) return $scope.teams[1].name
                        });
                        stats.streak = streakNames.join(', ');

                        $scope.stats = stats;
                        $scope.showStats = true;

                    }).catch(function(err){
                        notificationsService.generic();
                        console.log(err);
                        $scope.showStats = false;
                    });
                };

                $scope.createGame = function(){

                    var teamIdPromises = _.map($scope.teams, function(team){
                        // if we have an ID for this team already, just return it
                        if(team.id) return team.id;

                        // otherwise, use the teamsService to add the team first
                        var playerIds = _.pluck(team.players, 'id');
                        // todo - let the user add a team name
                        var playerNames = _.pluck(team.players, 'name').join(' and ');
                        return teamsService.addTeam(playerIds, playerNames).then(function(team){
                            // only need to return the ID
                            return team.id;
                        });
                    });

                    $q.all(teamIdPromises).then(function(teams){
                        return gamesService.add({
                            teamIds: teams
                        });
                    }).then(function(response){
                        $scope.createdGame = response;
                    }).catch(function(err){
                        // error handling
                        // todo - what if we just put a generic API error handler in the notifications service? so you
                        // just pass it the error and it determines if it's a 403, 404, etc.
                        if(err.status === 403){
                            notificationsService.unauthorised();
                        } else {
                            notificationsService.generic();
                        }
                        $scope.showStats = false;
                    });

                    return;


                };

            }
        }

    }]).directive('gamewidget', ['games', 'user', 'notifications', function(gamesService, userService, notificationsService){
        return {
            restrict: 'E',
            templateUrl: '/static/views/gamewidget.html',
            scope: {
                game: '=game',
                teams: '=teams',
                edit: '@edit'
            },
            link: function($scope, el, attrs){
                console.log('new gamewidget');

                // not to be confused with 'editing'
                $scope.editing = $scope.edit === 'true';

                // observe the user
                userService.onUserUpdate(function(user){
                    $scope.user = user;
                });

                // if the teams object updates, attach it to .game
                $scope.$watch('teams', function(teams){
                    if(teams && $scope.game){
                        // todo - move this into a reset function
                        $scope.game.teams = teams;
                        $scope.game = parseGameData($scope.game);
                        $scope.deleted = false;
                    }
                });

                $scope.$watch('game', function(game){
                    if(!game) return;
                    game = parseGameData(game);
                    $scope.deleted = false;
                });

                // parse the data the API returns to make it more readable and usable
                var parseGameData = function(game){
                    // format the date as a "x minutes ago"
                    game.readableDate = moment(game.date).format('MMM D, YYYY');

                    // create a duplicate date that we'll use for editing
                    // if you use the original, the game widget will move around the page
                    // if it's being sorted by date. hnnngg...
                    game.editableDate = game.date;

                    // need to set redemption to false if it's null
                    game.redemption = game.redemption || false;

                    // hasResults - if winner, loser and redemption are all not null
                    game.hasResults = !~[game.winningTeamId, game.losingTeamId, game.redemption].indexOf(null);

                    if(!game.hasResults) return game;

                    _.each(game.teams, function(team){
                        if(team.id === game.winningTeamId) game.winningTeam = team;
                        if(team.id === game.losingTeamId) game.losingTeam = team;
                    });

                    return game;
                };

                // set a loser by picking the team that didn't win
                $scope.setLoser = function(){
                    var teams = _.pluck($scope.game.teams, 'id').slice();
                    $scope.game.losingTeamId = _.without(teams, $scope.game.winningTeamId)[0];
                }

                // or set a winner by picking the team that didn't lose
                $scope.setWinner = function(){
                    var teams = _.pluck($scope.game.teams, 'id').slice();
                    $scope.game.winningTeamId = _.without(teams, $scope.game.losingTeamId)[0];
                };

                // hit the gamesService and update
                $scope.save = function(){
                    gamesService.save({
                        id: $scope.game.id,
                        winningTeamId: $scope.game.winningTeamId,
                        losingTeamId: $scope.game.losingTeamId,
                        redemption: $scope.game.redemption,
                        date: $scope.game.editableDate
                    }).then(function(game){
                        $scope.game = parseGameData(game);
                        $scope.editing = false;
                    }).catch(function(err){
                        if(err.status === 403){
                            notificationsService.unauthorised();
                        } else {
                            notificationsService.generic();
                            console.log(err);
                        }
                    });
                };

                $scope.delete = function(gameId){
                    gamesService.delete(gameId).then(function(){
                        $scope.deleted = true;
                    }).catch(function(err){
                        if(err.status === 403){
                            notificationsService.unauthorised();
                        } else {
                            notificationsService.generic();
                            console.log(err);
                        }
                    });
                };
            }
        };
    }]).directive('headernav', ['user', 'leagues', '$location', function(userService, leaguesService, $location){
        return {
            restrict: 'E',
            templateUrl: '/static/views/headernav.html',
            replace: true,
            scope: {},
            link: function($scope, $el, $attrs){

                // watch the $location provider and set .path every time it changes
                // we use this to set .active on the nav items
                $scope.$watch(function(){
                    return $location.path();
                }, function(path){
                    $scope.path = path;
                });

                $scope.setLeague = function(id){
                    leaguesService.setActiveLeague(id);
                };

                // register a callback with the users service to keep an eye on the user object
                userService.onUserUpdate(function(user){
                    $scope.user = user;
                    $scope.signedIn = user.signedIn;
                });

                leaguesService.onUpdate(function(leagues){
                    $scope.leagues = leagues;
                    $scope.activeLeague = _.find(leagues, function(league){
                        return league.active;
                    });
                });

                // todo - this sucks, use proper angular directives instead of vanilla bootstrap
                $el.one('mouseover', function(){
                    $($el).find('.dropdown-toggle').dropdown();
                });
            }
        }
    }]).directive('playerwidget', ['players', function(playersService){
        return {
            restrict: 'E',
            templateUrl: '/static/views/playerwidget.html',
            replace: false,
            scope: {
                player: '=player'
            },
            link: function($scope, $el, $attrs){

            }
        };
    }]).directive('messages', ['notifications', function(notificationsService){
        return {
            restrict: 'E',
            template: '<div id="messages" ng-class="{active:messages.length}"><div ng-repeat="message in messages" class="alert alert-warning" ng-class="message.class"><button type="button" class="close" ng-click="dismiss(this)">&times;</button>{{ message.text }}</div></div>',
            replace: true,
            scope: {},
            link: function($scope, $el, $attrs){

                $scope.messages = [];

                /**
                 * Dismiss a message
                 */
                $scope.dismiss = function(childScope){
                    var index = $scope.messages.indexOf(childScope.message);
                    $scope.messages.splice(index, 1);
                }

                // use the notificationsService to subscribe to 'messages',
                // and add them to the scope when we receive them.
                notificationsService.subscribe('messages', function(messages){
                    $scope.messages = $scope.messages.concat(messages);
                });

            }
        }
    }]).run(function($rootScope){
        $rootScope.testVar = 'foo';
    });

})();
