const port = process.env.PORT
const { Server } = require('socket.io')
const originUrl = process.env.NODE_ENV === 'development'
  ? `http://localhost:${port}`
  : 'https://new-aeriell-only-me-17f865b7.koyeb.app/'
const IoServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: originUrl,
      upgrades: ['websocket', 'polling']
    }
  })
  return io
}
module.exports = {
  IoServer
}
