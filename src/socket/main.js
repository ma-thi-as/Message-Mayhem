const { setupSocketServer, onlyForHandshake } = require('./init')
const setupHomeNamespace = require('./home')
const setupChannelNamespace = require('./channel')
const setupGuestLoginNamespace = require('./guest')

const initSocket = (httpServer, sessionConfig, passport) => {
  const io = setupSocketServer(httpServer)

  setupHomeNamespace(io, sessionConfig, passport)
  setupChannelNamespace(io, sessionConfig, passport)
  setupGuestLoginNamespace(io)
}

module.exports = initSocket
