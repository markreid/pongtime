(function(){
    'use strict';

    angular.module('pong').controller('leagueDetailController', ['$scope', '$routeParams', 'leagues', 'notifications', 'stats', 'user', function($scope, $routeParams, leaguesService, notificationsService, statsService, usersService){

        $scope.reset = function(){
            $scope.refreshing = true;
            leaguesService.setActiveLeague($routeParams.id);
            leaguesService.getLeagueDetail($routeParams.id).then(function(league){
                $scope.league = league;
                $scope.league.edited = _.extend({}, league);
                // todo - disabled until memory leak issues are sorted
                // $scope.stats = generateLeagueStats(league);
                // $scope.numPlayers = league.players.length;
                // $scope.numGames = league.games.length;
                $scope.refreshing = false;
            }).catch(function(err){
                if(err.status === 404){
                    return notificationsService.notFound();
                }
                notificationsService.generic();
                console.log(err);
            });
        };

        $scope.saveLeagueSettings = function(){
            $scope.saving = true;

            var data = _.extend({}, $scope.league.edited);
            data.members = _.pluck(data.members, 'id');
            data.moderators = _.pluck(data.moderators, 'id');

            leaguesService.save(data).then(function(league){
                console.log(league);
                $scope.league = league;
                $scope.league.edited = _.extend({}, league);
                parseMembersAndModerators();
            }).catch(function(err){
                if(err.status === 403){
                    notificationsService.unauthorised();
                } else {
                    notificationsService.generic();
                    console.log(err);
                }
            }).finally(function(){
                $scope.saving = false;
            });
        };

        $scope.showLeagueSettings = function(){
            usersService.getUsers().then(function(users){
                $scope.users = users;
                parseMembersAndModerators();
            }).catch(function(err){
                notificationsService.generic();
                console.log(err);
            });
            $scope.editing = true;
        };

        function parseMembersAndModerators(){
            var leagueMemberIds = _.pluck($scope.league.members, 'id');
            var leagueModeratorIds = _.pluck($scope.league.moderators, 'id');
            $scope.league.edited.members = [];
            $scope.league.edited.moderators = [];
            _.each($scope.users, function(user){
                // league.edited.members needs to be an array of references to $scope.users
                if(~leagueMemberIds.indexOf(user.id)) $scope.league.edited.members.push(user);
                if(~leagueModeratorIds.indexOf(user.id)) $scope.league.edited.moderators.push(user);
            });
        };


        // hit the leaguesService
        function getLeague(id){
            return leaguesService.getLeagueDetail(id);
        }

        function generateLeagueStats(league){

            var firstTeam = _.extend({}, _.find(league.teams, function(team){
                return team.stat.games;
            }));
            firstTeam.stat = statsService.parseStats(firstTeam.stat);

            var teamMostWins = [firstTeam];
            var teamMostLosses = [firstTeam];
            var teamBestPercentage = [firstTeam];
            var teamWorstPercentage = [firstTeam];
            var teamHottestStreak = [firstTeam];
            var teamColdestStreak = [firstTeam];

            _.each(league.teams, function(team){
                if(!team.stat.games) return;
                team.stat = statsService.parseStats(team.stat);

                teamMostWins = setHighest(teamMostWins, team, 'wins');
                teamMostLosses = setHighest(teamMostLosses, team, 'losses');
                teamBestPercentage = setHighest(teamBestPercentage, team, 'winPercentage');
                teamWorstPercentage = setHighest(teamWorstPercentage, team, 'lossPercentage');
                teamHottestStreak = setHighest(teamHottestStreak, team, 'hottest');
                teamColdestStreak = setHighest(teamColdestStreak, team, 'coldest');

            });

            var teamStats = [];
            teamStats.push(humanizeStat('Most wins', teamMostWins, 'wins'));
            teamStats.push(humanizeStat('Most losses', teamMostLosses, 'losses'));
            teamStats.push(humanizeStat('Best win-rate', teamBestPercentage, 'winPercentage', true));
            teamStats.push(humanizeStat('Worst loss-rate', teamWorstPercentage, 'lossPercentage', true));
            teamStats.push(humanizeStat('Hottest win streak', teamHottestStreak, 'hottest'));
            teamStats.push(humanizeStat('Coldest lose streak', teamColdestStreak, 'coldest'));



            var firstPlayer = _.extend({}, _.find(league.players, function(player){
                return player.stat.games;
            }));
            firstPlayer.stat = statsService.parseStats(firstPlayer.stat);

            var playerMostWins = [firstPlayer];
            var playerMostLosses = [firstPlayer];
            var playerBestPercentage = [firstPlayer];
            var playerWorstPercentage = [firstPlayer];
            var playerHottestStreak = [firstPlayer];
            var playerColdestStreak = [firstPlayer];

            _.each(league.players, function(player){
                if(!player.stat.games) return;
                player.stat = statsService.parseStats(player.stat);

                playerMostWins = setHighest(playerMostWins, player, 'wins');
                playerMostLosses = setHighest(playerMostLosses, player, 'losses');
                playerBestPercentage = setHighest(playerBestPercentage, player, 'winPercentage');
                playerWorstPercentage = setHighest(playerWorstPercentage, player, 'lossPercentage');
                playerHottestStreak = setHighest(playerHottestStreak, player, 'hottest');
                playerColdestStreak = setHighest(playerColdestStreak, player, 'coldest');
            });

            var playerStats = [];
            playerStats.push(humanizeStat('Most wins', playerMostWins, 'wins'));
            playerStats.push(humanizeStat('Most losses', playerMostLosses, 'losses'));
            playerStats.push(humanizeStat('Best win-rate', playerBestPercentage, 'winPercentage', true));
            playerStats.push(humanizeStat('Worst loss-rate', playerWorstPercentage, 'lossPercentage', true));
            playerStats.push(humanizeStat('Hottest win streak', playerHottestStreak, 'hottest'));
            playerStats.push(humanizeStat('Coldest lose streak', playerColdestStreak, 'coldest'));

            return {
                team: teamStats,
                player: playerStats
            };

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
                return arr;
            }
            if(team.stat[prop] === arr[0].stat[prop] && arr[0].id !== team.id){
                arr.push(team);
                return arr;
            }
            return arr;
        }

        function setLowest(arr, team, prop){
            if(team.stat[prop] < arr[0].stat[prop]){
                arr = [team]
                return arr;
            }
            if(team.stat[prop] === arr[0].stat[prop] && arr[0].id !== team.id){
                arr.push(team);
                return arr;
            }
            return arr;
        }

        function humanizeStat(title, teams, prop, percentage){
            return {
                title: title,
                value: _.pluck(teams, 'name').join(', ') + ' (' + teams[0].stat[prop] + (percentage ? '%' : '') + ')'
            };
        }


        $scope.reset();
        // register a callback with the users service to keep an eye on the user object
        usersService.onUserUpdate(function(user){
            $scope.canEdit = user.isAdmin;
        });

    }]);
})();
