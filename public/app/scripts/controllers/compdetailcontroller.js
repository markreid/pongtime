(function(){
    'use strict';

    angular.module('pong').controller('compDetailController', ['$scope', '$routeParams', 'comps', 'notifications', 'stats', 'user', function($scope, $routeParams, compsService, notificationsService, statsService, usersService){

        $scope.reset = function(){
            $scope.refreshing = true;
            compsService.setActiveComp($routeParams.id);
            compsService.getCompDetail($routeParams.id).then(function(comp){
                $scope.comp = comp;
                $scope.comp.edited = _.extend({}, comp);
                // todo - disabled until memory leak issues are sorted
                // $scope.stats = generateCompStats(comp);
                // $scope.numPlayers = comp.players.length;
                // $scope.numGames = comp.games.length;
                $scope.refreshing = false;
            }).catch(function(err){
                if(err.status === 404){
                    return notificationsService.notFound();
                }
                notificationsService.generic();
                console.log(err);
            });
        };

        $scope.saveCompSettings = function(){
            $scope.saving = true;

            var data = _.extend({}, $scope.comp.edited);
            data.members = _.pluck(data.members, 'id');
            data.moderators = _.pluck(data.moderators, 'id');

            compsService.save(data).then(function(comp){
                console.log(comp);
                $scope.comp = comp;
                $scope.comp.edited = _.extend({}, comp);
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

        $scope.showCompSettings = function(){
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
            var compMemberIds = _.pluck($scope.comp.members, 'id');
            var compModeratorIds = _.pluck($scope.comp.moderators, 'id');
            $scope.comp.edited.members = [];
            $scope.comp.edited.moderators = [];
            _.each($scope.users, function(user){
                // comp.edited.members needs to be an array of references to $scope.users
                if(~compMemberIds.indexOf(user.id)) $scope.comp.edited.members.push(user);
                if(~compModeratorIds.indexOf(user.id)) $scope.comp.edited.moderators.push(user);
            });
        };


        // hit the compsService
        function getComp(id){
            return compsService.getCompDetail(id);
        }

        function generateCompStats(comp){

            var firstTeam = _.extend({}, _.find(comp.teams, function(team){
                return team.stat.games;
            }));
            firstTeam.stat = statsService.parseStats(firstTeam.stat);

            var teamMostWins = [firstTeam];
            var teamMostLosses = [firstTeam];
            var teamBestPercentage = [firstTeam];
            var teamWorstPercentage = [firstTeam];
            var teamHottestStreak = [firstTeam];
            var teamColdestStreak = [firstTeam];

            _.each(comp.teams, function(team){
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



            var firstPlayer = _.extend({}, _.find(comp.players, function(player){
                return player.stat.games;
            }));
            firstPlayer.stat = statsService.parseStats(firstPlayer.stat);

            var playerMostWins = [firstPlayer];
            var playerMostLosses = [firstPlayer];
            var playerBestPercentage = [firstPlayer];
            var playerWorstPercentage = [firstPlayer];
            var playerHottestStreak = [firstPlayer];
            var playerColdestStreak = [firstPlayer];

            _.each(comp.players, function(player){
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
