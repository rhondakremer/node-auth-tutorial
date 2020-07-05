var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Auth packages
const session = require('express-session');
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;;
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');

var index = require('./routes/index');
var users = require('./routes/users');


var PORT = 3001;
var app = express();

require('dotenv').config();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database : process.env.DB_NAME
};

var sessionStore = new MySQLStore(options);

// returns cookie to user that can be used with passport
app.use(session({
    secret: 'sdjkfhakdjsfh', // random string
    store: sessionStore,
    resave: false, // should session be updated even if no change made? session only saved when change is made
    saveUninitialized: false, // if cookie should be generated before user is logged in 
    // cookie: { secure: true } // if https should be enabled
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/users', users);

passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log("app.js", username, password)
        const db = require('./db');

        db.query('SELECT id, password FROM users WHERE username = ?', [username], function(err, results, fields) {
            if (err) { return done(err) };
            console.log("res", results.length)
            if (results.length === 0) {
                return done(null ,false);
            }
            const hash = results[0].password.toString();
            bcrypt.compare(password, hash, function(err, response) {
                if (response === true) {
                    console.log("yes")
                    return done(null, {user_id: results[0].id})
                } else {
                    return done(null, false);
                }
            })
        })
    }
));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');

const partialsDir = __dirname + '/views/partials';

const filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
    const matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) {
        return;
    }
    const name = matches[1];
    const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
    hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
});

app.listen(PORT, function() {
    console.log("Server listening on: http://localhost:" + PORT);
});

module.exports = app;