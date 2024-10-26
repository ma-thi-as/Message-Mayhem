const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const partials = require('express-partials')
const path = require('path')
const { authentication } = require('../auth/auth')
const sessionConfig = require('../db/mongodb/mongoSessions')
const passport = require('passport')

module.exports = (app) => {
  // Config. view engine
  app.set('views', path.join(__dirname, '/../views'))
  app.set('view engine', 'ejs')

  // Config. middleware
  app.use(partials()) // Adds support for layout and partial templates.
  app.use(bodyParser.urlencoded({ extended: true })) // Parses URL-encoded request bodies.
  app.use(bodyParser.json()) // Parses JSON request bodies.
  app.use(methodOverride()) // Enables support for HTTP methods like PUT and DELETE.

  app.use(express.static(path.join(__dirname, '../public')))
  app.use(express.static(path.join(__dirname, '../files')))

  app.use(sessionConfig)
  app.use(passport.initialize()) // Initializes Passport for authentication.
  app.use(passport.session()) // Integrates Passport with sessions for persistent login states.
  authentication()
}
