/**
 * Directives
 */

(function(){

    angular.module('pong').directive('teamwidget', ['teams', function(teamsService){
        return {
            templateUrl: '/static/views/teamwidget.html',
            restrict: 'E',
            scope: {
                teamData: '=team',
            },
            link: function($scope, el, attrs){

                // hint: use the .teamData object to update the teams in their parent scope

                var reset = function(){
                    $scope.team = {};
                    $scope.playerNames = _.pluck($scope.teamData.players, 'name').join(' and ');
                    $scope.singlePlayer = $scope.teamData.players.length === 1;
                    $scope.fetching = true;
                };

                var fetch = function(){
                    $scope.fetching = true;
                    var playerIds = _.pluck($scope.teamData.players, 'id');
                    teamsService.getTeamByPlayers(playerIds).then(function(response){
                        $scope.exists = true;
                        $scope.team = response.data;
                        $scope.stats = generateStats(response.data.stat);
                        $scope.teamData.id = response.data.id;
                        $scope.teamData.name = response.data.name;
                        $(el).trigger('pngTeamWidgetSync');
                    }).catch(function(err){
                        $scope.team = {};
                        $scope.stats = generateStats(false);
                        $scope.teamData.id = null;

                        if(err.status === 404){
                            $scope.exists = false;
                            $(el).trigger('pngTeamWidgetSync');
                        }

                    }).finally(function(){
                        $scope.fetching = false;
                    });
                };

                $scope.toggleDetailedStats = function(){
                    $scope.showDetailedStats = !$scope.showDetailedStats;
                };

                var generateStats = function(stats){
                    if(!stats || stats.games === 0) return {
                        available: false,
                        paragraph: 'No games played yet'
                    };

                    // otherwise, fill in some mad shit.
                    var winPercentage = Math.round((stats.wins/stats.games)*100);
                    var lossPercentage = Math.round((stats.losses/stats.games)*100);

                    var paragraph = stats.wins + ' out of ' + stats.games + ' wins (' + winPercentage + '%). '
                    if(stats.streak) paragraph += 'On a ';
                    if(stats.streak === 1) paragraph += '1 win ';
                    if(stats.streak === -1) paragraph += '1 loss ';
                    if(stats.streak < -1) paragraph += stats.streak*-1 + ' loss ';
                    if(stats.streak > 1) paragraph += stats.streak + ' win ';
                    if(stats.streak) paragraph += 'streak.';

                    return {
                        available: true,
                        paragraph: paragraph
                    }
                };


                // reset our scope when the teamData attribute changes.
                // won't catch changes to individual properties (ie teamData.name), so we can
                // update those without triggering a watch here.
                $scope.$watch('teamData', function(){
                    reset();
                    fetch();
                });
            }
        }
    }]).directive('creategame', ['teams', 'games', '$q', function(teamsService, gamesService, $q){
        return {
            templateUrl: '/static/views/creategamewidget.html',
            restrict: 'E',
            scope: {
                teams: '=teams'
            },
            link: function($scope, el, attrs){

                /**
                 * Reset scope to initial state.
                 */
                $scope.reset = function(){
                    $scope.teamsReady = false;
                    $scope.readyTeamWidgetCount = 0;
                    $scope.stats = {};
                    $scope.showStats = false;
                    $scope.createdGame = null;
                };

                // if the teams change, call a reset
                $scope.$watch('teams', $scope.reset);

                // if both team widgets are ready, try and fetch the game stats
                $scope.$watch('readyTeamWidgetCount', function(val){
                    if(val === 2){
                        $scope.teamsReady = true;
                        fetchGameStats();
                    }
                });

                $(el).on('pngTeamWidgetSync', function(){
                    $scope.readyTeamWidgetCount++;
                });

                /**
                 * Fetch the head-to-head history of these two teams.
                 * @return {[type]} [description]
                 */
                var fetchGameStats = function(){
                    // silent failure if we don't have a team ID for each team (ie, they're new)
                    var teamIds = _.pluck($scope.teams, 'id');
                    if(teamIds.length !== 2 || ~teamIds.indexOf(null)) return;

                    gamesService.getGameStats(teamIds).then(function(stats){
                        if(!stats){
                            $scope.stats = {};
                            $scope.showStats = false;
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
                        // todo - handle me properly
                        console.log('oh noooooo');
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
                        var playersString = _.pluck(team.players, 'name').join(' and ');
                        return teamsService.addTeam(playerIds, playersString).then(function(response){
                            // only need to return the ID
                            return response.data.id;
                        });
                    });

                    $q.all(teamIdPromises).then(function(teams){
                        return gamesService.add({
                            teams: teams
                        });
                    }).then(function(response){
                        $scope.createdGame = response.data;
                    }).catch(function(err){
                        // todo - error handling
                        console.log('m-m-m-m-meltdoooooooown');
                    });

                    return;


                };

            }
        }

    }]).directive('gamewidget', ['games', function(gamesService){
        return {
            restrict: 'E',
            templateUrl: '/static/views/gamewidget.html',
            scope: {
                game: '=game',
                teams: '=teams'
            },
            link: function($scope, el, attrs){

                var gamesService = angular.injector(['pong', 'ng']).get('games');

                // if the teams object updates, attach it to .game
                $scope.$watch('teams', function(teams){
                    if(teams && $scope.game){
                        $scope.game.teams = teams;
                        $scope.game = parseGameData($scope.game);
                    }
                });

                $scope.$watch('game', function(game){
                    if(!game) return;
                    game = parseGameData(game);
                });

                // parse the data the API returns to make it more readable and usable
                var parseGameData = function(game){
                    // format the date as a "x minutes ago"
                    game.date = moment(game.date).fromNow();

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
                        redemption: $scope.game.redemption
                    }).then(function(response){
                        $scope.$apply(function(){
                            $scope.game = parseGameData(response.data);
                        });
                    }).catch(function(err){
                        console.log('error saving game:');
                        console.log(err);
                    });
                };

            }
        };
    }]).directive('headernav', [function(){
        return {
            restrict: 'E',
            templateUrl: '/static/views/headernav.html',
            link: function($scope, el, attrs){
                console.log('headernav.link()');
            }
        }
    }]);

})();
