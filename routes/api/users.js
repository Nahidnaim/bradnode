const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');
// load user model
const User = require('../../models/User');

// @route GET api/users/test
// @desc Tests user route
// @access Public
router.get('/test', (req, res) => res.json({ msg: 'Users works...' }));

// @route POST api/user/register
// @desc Register a user
// @access Public

router.post('/register', (req, res) => {
    User.findOne({ email: req.body.email})
        .then(user => {
            if (user){
                return res.status(400).json({email: 'Email already exist'});
            } else{
                const avatar = gravatar.url(req.body.email, {
                    s: '200', // size
                    r: 'pg', // rate
                    d: 'mm' // default
                });

                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    avatar: avatar,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => res.json(user))
                            .catch(err => console.log(err))
                    });
                });
            }
        });
});

// @route POST api/user/login
// @desc User Login
// @access Public

router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // find user by email
    User.findOne({email}).then(user => {
        // check for user
        if(!user){
            return res.status(404).json({ email : 'User not found...'});
        }

        // check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if(isMatch){
                // user matched
                //create jwt payload
                const payload = { id: user.id, name: user.name, avatar: user.avatar }
                // sign token
                jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
                    res.json({
                        success: true,
                        token: 'Bearer ' + token
                    })
                });
            } else{
                return res.status(400).json({ password: 'Password incorrect...' });
            }
        })
    })
});

// @route POST api/users/current
// @desc Return current user
// @access Private

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ msg: 'Success'});
});

module.exports = router;