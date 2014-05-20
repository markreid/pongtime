(function(){
    'use strict';

    angular.module('pong').controller('leagueDetailController', ['$scope', '$routeParams', 'leagues', 'notifications', function($scope, $routeParams, leaguesService, notificationsService){

        $scope.reset = function(){
            $scope.refreshing = true;
            leaguesService.setActiveLeague($routeParams.id);
            leaguesService.getLeagueDetail($routeParams.id).then(function(league){
                $scope.league = league;
                $scope.stats = generateLeagueStats(league);
                $scope.hasBeenEdited = false;
                $scope.numPlayers = league.players.length;
                $scope.numGames = league.games.length;
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            }).finally(function(){
                $scope.refreshing = false;
            });
        };

        $scope.save = function(){
            leaguesService.save($scope.league).then(function(league){
                $scope.league = league;
                $scope.hasBeenEdited = false;
            }).catch(function(err){
                if(err.status === 403){
                    notificationsService.unauthorised();
                } else {
                    notificationsService.generic();
                    console.log(err);
                }
            });
        };

        // hit the leaguesService
        function getLeague(id){
            return leaguesService.getLeagueDetail(id);
        }

        function generateLeagueStats(league){
            // team with most wins
            // team with highest win rate
            // team with most losses
            // team with lowest win rate
            // player with most wins
            // player with most losses

            var stats = [];

            return;

            var teamStats = [];
            var teamNameLookup = {};
            var teamMostWins = [league.teams[0]];
            var teamMostLosses = [league.teams[0]];
            var teamBestPercentage = [league.teams[0]];
            var teamWorstPercentage = [league.teams[0]];

            _.each(league.teams, function(team){
                teamStats.push(team.stat);
                teamNameLookup[team.id] = team.name;

                // most wins
                if(team.stat.wins > teamMostWins[0].stat.wins) {
                    teamMostWins = [team];
                } else{
                    if(team.stat.wins === teamMostWins[0].stat.wins && teamMostWins.id !== team.id) teamMostWins.push(team);
                }

                // most losses
                if(team.stat.losses > teamMostLosses[0].stat.losses) {
                    teamMostLosses = [team];
                } else{
                    if(team.stat.losses === teamMostLosses[0].stat.losses) teamMostLosses.push(team);
                }

                // best percentage
                if(team.stat.losses > teamMostLosses[0].stat.losses) {
                    teamMostLosses = [team];
                } else{
                    if(team.stat.losses === teamMostLosses[0].stat.losses) teamMostLosses.push(team);
                }

            });

            if(teamMostWins.length < 4){
                stats.push({
                    title: 'Most wins',
                    value: _.pluck(teamMostWins, 'name').join(', ') + ' (' + teamMostWins[0].stat.wins + ')'
                });
            }

            if(teamMostLosses.length < 4){
                stats.push({
                    title: 'Most losses',
                    value: _.pluck(teamMostLosses, 'name').join(', ') + ' (' + teamMostLosses[0].stat.losses + ')'
                });
            }

            return stats;


        }

        $scope.reset();

    }]);
})();
