var express = require('express');
var router = express.Router();
const db = require('../db.js');
const { check, validationResult } = require('express-validator');

/* GET home page. */
router.get('/', function(req, res, next) {
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
    
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password], function(error, results, fields) {
            if (error) throw error;
            res.render('index', { title: 'Registration Complete' });
        });
    }

});

module.exports = router;