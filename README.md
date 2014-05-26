# PongTime
#### PongTime is a web app for keeping track of your office table tennis games.


### Features
- Generate random teams out of a group of players
- Track game results - who played, who won
- Record team statistics - wins, losses, hot and cold streaks
- Track stats for individual players

### The stack

PongTime is end-to-end javascript; Node on the server and Angular on the client.  

The server app is powered by [Express](http://expressjs.com/) and uses [Sequelize ORM](http://sequelizejs.com). Personally I use it with Postgres but theoretically it should work with whatever dialects are supported by Sequelize.  It also uses [Redis](http://www.redis.io) as a session store, but this should be pretty interchangeable via Express modules too.  Express serves up a single page Angular app, which communicates with the backend via a REST API.   

### Installation

Assuming you've already got Node and your DB installed...

```
# install node dependencies 
npm install

# copy the example config file, edit it with your DB, redis, google auth settings
cp config.example.js config.js

# install bower dependencies
# you need bower in your path, easiest way is to install globally
npm install -g bower

# install the frontend dependencies with bower
cd public
bower install
```


### Running it

You can fire it up with `node pong`, but if you want to run it as a daemon, you can use [forever](https://www.npmjs.org/package/forever).

There's a super-basic CLI tool in *models/dbutils.js* that has a few functions you can call with `node models/dbutils command`
- **sync**: syncs the db using *force true* (wipes everything clean)
- **createsuperuser**: create a new super user
- **makesuperuser**: give an existing user admin rights
- **simgames**: simulate a number of games for dev purposes

