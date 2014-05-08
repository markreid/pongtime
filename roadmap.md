# pong time, gentlemen?

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


### to-do list

#### clientside

* Keep a cache of team data in the teams service, so you can do a lookup by ID without hitting the server, and we don't need to pass teams around the views everywhere.
* The let's roll button should be disable after you've hit it, until you generate teams again. Potentially forward you to the games view.
* Teams view
* Players view


#### serverside

* Auth for API
* Add a date to games
* Stats refresh method
* Player stats
* Team slugs


### Proposed Schema

Player
    id*
    name
    teams => PlayersTeam => Team

User
    player ->
    auth [1,2,3]
    email
    g+ identifier

Team
    name
    players => PlayersTeam => Player

Game
    date
    teams => GamesTeam => Team
    winner ->
    loser ->
    redemption YN
    pants YN

Stats
    team ->
    games
    wins
    losses
    hottest
    hottestend
    coldest
    coldestend
    streak
    redemptionsGiven
    redemptionsHad
    pantsGiven
    pantsHad



### Clientside flow

#### Starting a game

* Select players
* Lookup teams, show stats.
* Confirm -> Create game
* Ask for results -> Create teams -> Update game
