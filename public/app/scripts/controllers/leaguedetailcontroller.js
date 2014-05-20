(function(){
    'use strict';

    angular.module('pong').controller('leagueDetailController', ['$scope', '$routeParams', 'leagues', 'notifications', 'stats', function($scope, $routeParams, leaguesService, notificationsService, statsService){

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

            var first = _.extend({}, _.find(league.teams, function(team){
                return team.stat.games
            }));
            first.stat = statsService.parseStats(first.stat);

            var teamMostWins = [first];
            var teamMostLosses = [first];
            var teamBestPercentage = [first];
            var teamWorstPercentage = [first];

            _.each(league.teams, function(team){
                if(!team.stat.games) return;
                team.stat = statsService.parseStats(team.stat);

                setHighest(teamMostWins, team, 'wins');
                setHighest(teamMostLosses, team, 'losses');
                setHighest(teamBestPercentage, team, 'winPercentage');
                setHighest(teamWorstPercentage, team, 'lossPercentage');

            });

            var stats = [];
            stats.push(humanizeStat('Most wins', teamMostWins, 'wins'));
            stats.push(humanizeStat('Most losses', teamMostLosses, 'losses'));
            stats.push(humanizeStat('Best win-rate', teamBestPercentage, 'winPercentage'));
            stats.push(humanizeStat('Worst loss-rate', teamWorstPercentage, 'lossPercentage'));

            return stats;

        }

        /**
         * [setHighest description]
         * @param {[type]} arr  [description]
         * @param {[type]} team [description]
         * @param {[type]} prop [description]
         */
        function setHighest(arr, team, prop){
            if(team.stat[prop] > arr[0].stat[prop]){
                arr = [team]
                return;
            }
            if(team.stat[prop] === arr[0].stat[prop] && arr[0].id !== team.id){
                arr.push(team);
                return;
            }
        }

        function humanizeStat(title, teams, prop){
            return {
                title: title,
                value: _.pluck(teams, 'name').join(', ') + ' (' + teams[0].stat[prop] + ')'
            };
        }


        $scope.reset();

    }]);
})();
