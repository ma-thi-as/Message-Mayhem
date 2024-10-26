const config = require('./config/express') // Required config & imports
require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const http = require('http')
const passport = require('passport')
const httpServer = http.createServer(app)
const sessionConfig = require('./db/mongodb/mongoSessions')
const router = require('./routes/routes')
const initSocket = require('./socket/main')

config(app)

app.use('/', router)
initSocket(httpServer, sessionConfig, passport)

httpServer.listen(port, () => {
  console.log(`App running on port ${port}`)
})
