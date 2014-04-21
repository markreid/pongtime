/**
 * pong.js
 * express server for pongomatic
 */

var config = require('./config');

var express = require('express');
var path = require('path');
//var favicon = require('connect/node_modules/static-favicon');
var logger = require('morgan');
var cookieParser = require('connect/node_modules/cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes');
var apiroutes = require('./routes/api');

var app = express();

var db = require('./models');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

//app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1/', apiroutes);
app.use('/', routes);


/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.listen(2020);

module.exports = app;
