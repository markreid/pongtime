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
    }]).directive('gamewidget', ['teams', 'games', function(teamsService, gamesService){
        return {
            templateUrl: '/static/views/gamewidget.html',
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


                $scope.showTeams = function(){
                    console.log($scope.teams);
                }

                $scope.generateGame = function(){
                    var apiHits = _.map($scope.teams, function(team){
                        // if the team has an ID, it exists, do nothing
                        if(team.id) return;

                        // otherwise, create the team by passing player IDs
                        var playerIds = _.pluck(team.players, 'id');
                        return teamsService.addTeam(playerIds);
                    });

                    console.log(apiHits);

                    $.when.apply(this, apiHits).then(function(){
                        console.log('teams were added:');
                        console.log(arguments);
                    });

                    return;

                    var teamIds = _.pluck($scope.teams, 'id');

                    if(teamIds.length === 2 && !~teamIds.indexOf(null)){
                        this.addGame(teamIds);
                    }

                    var apiHits = [];
                    _.each($scope.teams)

                    $.when([])

                    // if both teams already exist, gamesService.add()
                    // otherwise make the teams first, then gamesService.add()

                    var teamIds = _.pluck($scope.teams, 'id');
                    console.log(teamIds);


                };

            }
        }

    }]);

})();
