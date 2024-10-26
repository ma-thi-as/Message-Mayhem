const passport = require('passport')
const { randomUUID } = require('crypto')
const bcrypt = require('bcrypt')
const GitHubStrategy = require('passport-github2').Strategy
const LocalStrategy = require('passport-local').Strategy
const { User } = require('../models/User')
const { Guest } = require('../models/Guest')
const { insertQuery, getBy, updateQuery } = require('../db/mongodb/atlas')
const generatePassword = require('../utils/authHelpers')
const { RedisDB } = require('../db/redis/redis')

async function checkAccessToken (accessToken) {
  const request = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  if (request.status === 200) {
    const response = await request.json()
    return response
  } else {
    return false
  }
}

function authentication () {
  passport.serializeUser(function (user, done) {
    done(null, user)
  })

  passport.deserializeUser(function (obj, done) {
    done(null, obj)
  })

  passport.use('anonymous', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, username, password, done) => {
    try {
      const userID = req.body.userID
      const redis = RedisDB.getInstance()
      const anonUserCheck = await redis.client.get(`anonymous-user:${userID}`)
      if (anonUserCheck === null) return done({ message: 'user not found', type: 'Anonymous' })

      return done(null, JSON.parse(anonUserCheck))
    } catch (error) {
    // If an error occurs, pass it to done
      return done(error)
    }
  }))

  passport.use('guest', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, async (username, password, done) => {
    try {
      const guestUser = await getBy('guests', { username })
      if (!guestUser) {
      // If user is not found, call done with `false`
        return done(null, false, { message: 'User does not exist' })
      }

      const isPasswordValid = await bcrypt.compare(password, guestUser.tempPassword)
      if (!isPasswordValid) {
      // If the password is invalid, call done with `false`
        return done(null, false, { message: 'Incorrect password' })
      }

      // User and password match, proceed with login
      return done(null, guestUser)
    } catch (error) {
    // If an error occurs, pass it to done
      return done(error)
    }
  }))

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },

  function (accessToken, refreshToken, profile, done) {
    process.nextTick(async function async () {
      const user = new User(profile.id, profile.username, accessToken, refreshToken)
      const GUESTID_PREFIX = `${user.userID}+01`
      const GUESTUSERNAME_PREFIX = `${user.username} guest`
      const guestUser = new Guest(user, GUESTID_PREFIX, GUESTUSERNAME_PREFIX)
      const ceckIfUserExists = await getBy('users', { userID: user.userID })
      if (ceckIfUserExists === null) await insertQuery('users', { userID: user.userID, username: user.username })

      const checkIfGuestExists = await getBy('guests', { userID: guestUser.userID })

      if (checkIfGuestExists === null) await insertQuery('guests', guestUser)
      return done(null, user)
    })
  }
  ))
};

// Middleware: check if user is authenticated if not redirect to login page.
async function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user._accessToken) {
      // GitHub OAuth user, check token validity
      const tokenChecker = await checkAccessToken(req.user._accessToken)
      if (tokenChecker !== false) {
        const guestUser = await getBy('guests', { 'user.userID': req.user.userID })
        if (guestUser) {
          await updateQuery('guests', { 'user.userID': req.user.userID }, {
            $set: { 'user._accessToken': req.user._accessToken, 'user._refreshToken': req.user._refreshToken }
          })
        }
        return next()
      }
      return res.redirect('/auth')
    } else if (req.user.tempPassword) {
      // Guest user and Anon users, no additional token validation needed
      const mongo = await getBy('guests', { userID: req.user.userID, tempPassword: req.user.tempPassword })
      if (mongo) return next()
      else return res.redirect('/auth')
    } else if (req.user.password) {
      const redis = RedisDB.getInstance()
      const query = await redis.client.get(`anonymous-user:${req.user.userID}`)
      if (query) return next()
      else return res.redirect('/auth')
    }
  }
  res.redirect('/auth')
}

module.exports = {
  authentication,
  ensureAuthenticated,
  checkAccessToken
}

module.exports = {
  authentication, ensureAuthenticated, checkAccessToken
}
