// SocketIO logic
const { IoServer } = require('./socket')
const setupSocketServer = (httpServer) => {
  const io = IoServer(httpServer)
  // Apply middlewares only for the handshake
  return io
}

// Helper function for handshake middlewares
const onlyForHandshake = (middleware) => (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.EIO) {
    middleware(socket, next)
  } else {
    next()
  }
}

module.exports = { setupSocketServer, onlyForHandshake }
