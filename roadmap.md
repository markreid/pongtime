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



#### Adding and removing players
`Player` model


Player
    name
    title
    slug
    email
    image
    teams =>
    stats ->

User
    player ->
    auth [1,2,3]
    email
    g+ identifier

Team
    players =>

Game
    date
    teams =>
    winner ->
    loser ->
    redemption YN
    pants YN

Stats
    player ->
    hottest streak
    coldest streak
    current streak
