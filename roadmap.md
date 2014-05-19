# pong time, gentlemen?

## currently broken

* PUT /games/x/ returns empty response, needs to return values


### to-do list

#### clientside

* Keep a cache of team data in the teams service, so you can do a lookup by ID without hitting the server, and we don't need to pass teams around the views everywhere.


#### serverside

* Proper auth model
* Validation on all internal & REST API calls
* When updating a previously saved game, we should only call the stats refresh method if any of the values have actually changed
* Shortcut for changing the most recent game results only (without triggering complete stats refresh)
* Require auth to use the stats refresh call in REST API
* League defaults to -1 if they haven't chosen one before - the API needs to catch this and say "invalid league" so the client can tell them to choose one.
* Add a dev/prod switch for the API 300ms delay
* Team slugs


#### database

* Can SQL enforce that game.winningTeamId != game.losingTeamId ...?
* Can we add a cascade so that deleting a player deletes the associated stat? Currently it works backwards with a Restrict (can't delete stat while it has a player/team)...
    * I think it's a no because there's no reference to the player/team from the stat, it's backwards. You might need a trigger instead.
* 



### features

* add/remove players
* keep score and stats
    * how many times has a team won/lost
        * count games where winner = team
    * how many times has a player won/lost
        * count games where winner in teams (teams => player.teams)
    * hot/cold streaks
        * get team games. calculate sequential win/loss.
    * redemption & pants records
        * redeemed
            * get team games. filter by team lost but redemption true
        * unredeemed
            * get team games. filter by team lost and redemption false
        * gave redemption
            * get team games, filter by team won and redemption true
        * lost redemption
            * get team games, filter by team won and redemption false


