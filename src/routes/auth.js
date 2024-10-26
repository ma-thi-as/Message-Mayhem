const { randomUUID } = require('crypto')
const express = require('express')
const passport = require('passport')
const router = express.Router()
const bcrypt = require('bcrypt')
const { getBy, updateQuery } = require('../db/mongodb/atlas')
const { ensureAuthenticated } = require('../auth/auth')
const generatePassword = require('../utils/authHelpers')
const { RedisDB } = require('../db/redis/redis')

router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }))

router.post('/auth/get/token', async (req, res) => {
  const { userID } = req.body
  if (!userID) return res.status(400).json({ Message: 'Please provide a valid userID' })
  const getSessionData = await getBy('sessions', { 'session.passport.user.userID': String(userID) })
  if (getSessionData === null) return res.status(400).json({ Message: 'The current user not have a session saved.' })
  const { session: { passport: { user } } } = getSessionData

  res.status(200).json(user)
})

router.get('/login/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect('/home')
  }
)

router.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err) }
    res.redirect('/')
  })
})

router.get('/guest/init/', ensureAuthenticated, async (req, res) => {
  const saltRound = 10
  const randomPassword = generatePassword()

  bcrypt.genSalt(saltRound, (err, salt) => {
    if (err) console.error(err)

    bcrypt.hash(randomPassword, salt, async (err, hash) => {
      if (err) console.error(err)

      // Update the password in the database
      await updateQuery('guests', { userID: `${req.user.userID}+01` }, { $set: { tempPassword: hash } })
    })
  })

  res.json({ message: 'OK', generatedPass: randomPassword })
})

router.post('/guest/auth', passport.authenticate('guest'), async (req, res, next) => {
  if (!req.user) {
    return res.status(400).json({ Message: 'Authentication failed' })
  }

  // No need to fetch the user again, `req.user` is already available
  const guestUser = req.user

  if (!guestUser.tempPassword) {
    return res.status(400).json({ Message: 'Please generate a valid password', type: 'values' })
  }

  // If everything is valid, return a success response
  return res.status(200).json({ message: 'Guest authenticated successfully' })
})

/* router.post('/auth/anonymous', passport.authenticate('anonymous'), (req, res) => {
  res.status(200).json({ message: 'OK' })
}) */
router.post('/auth/anonymous', (req, res, next) => {
  // Use passport.authenticate with a promise-based approach
  passport.authenticate('anonymous', (err, user, info) => {
    if (err) {
      return res.status(400).json(err) // Pass any error to the global error handler
    }

    if (!user) {
      // Handle the case where authentication failed
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        // Handle errors during login
        return next(loginErr)
      }

      // If everything is successful
      return res.status(200).json({ message: 'OK', user })
    })
  })(req, res, next) // Important: invoke the returned middleware with req, res, next
})

router.get('/auth/get/anonymous_user', async (req, res) => {
  const redis = RedisDB.getInstance()
  let setNewAnon = null
  const generateRandomUser = () => {
    const uuid = randomUUID()
    const anonObject = { userID: uuid, username: `anonymous-${uuid.substring(uuid.length - 5, uuid.length)}`, password: generatePassword(),isAnon: true }
    return anonObject
  }
  const randomUser = generateRandomUser()
  const checkIfExists = await redis.client.get(`anonymous-user:${randomUser.userID}}`)
  if (checkIfExists === null) {
    setNewAnon = await redis.client.set(`anonymous-user:${randomUser.userID}`, JSON.stringify(randomUser))
    if (setNewAnon !== 'OK') return res.status(400).json({ message: 'Failed creating a new user' })
    return res.status(200).json({ message: 'OK', user: randomUser })
  } else {
    const newRandomUser = generateRandomUser()
    setNewAnon = await redis.client.set(`anonymous-user:${newRandomUser.userID}`, JSON.stringify(newRandomUser))
    if (setNewAnon !== 'OK') return res.status(400).json({ message: 'Failed creating a new user' })
    return res.status(200).json({ message: 'OK', user: newRandomUser })
  }
})
router.get('/auth', (req, res) => {
  console.log(req.authMatcher)

  res.render('guest', { formData: req.body })
})

module.exports = router
