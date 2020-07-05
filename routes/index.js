var express = require('express');
var router = express.Router();
const db = require('../db.js');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');

/* GET home page. */

router.get('/', function(req, res, next) {
    // next two lines come with passport
    console.log(req.user);
    console.log(req.isAuthenticated());
    res.render('home', { title: 'Homepage' });
});

router.get('/profile', authenticationMiddleware(), function(req, res) {
    res.render('profile', { title: 'Profile' })
})

router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' })
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile', // if successful authentication
    failureRedirect: 'login' // if failed authentication
}))

router.get('/logout', function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
})

router.get('/register', function(req, res, next) {
    res.render('index', { title: 'Registration' });
});

router.post('/register', [
    check('username').isLength({ min: 5 }),
    check('email').isEmail(),
    check('password').isLength({ min: 8, max: 40 }),
    // check('password').equals('passwordMatch')
], function(req, res, next) {
    const errors = validationResult(req);
    console.log("fml", errors.errors)
    if (!errors.isEmpty()) {
        res.render('index', { title: 'Registration Error, oopsies!', errors: errors.errors })
        return;
    } else {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
    

        bcrypt.hash(password, saltRounds, function(err, hash) {
            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function(error, results, fields) {
                if (error) throw error;

                db.query('SELECT LAST_INSERT_ID() AS user_id', function(error, results, fields) {
                    if (error) throw error;
                    const user_id = results[0];
                    req.login(user_id, function(err) {
                        res.redirect('/')
                    })
                })
            });
        });

    }

});

passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

function authenticationMiddleware() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    }
}

module.exports = router;