const { RedisDB } = require('../db/redis/redis')

const setupGuestLoginNamespace = (io) => {
  const channelNamespace = io.of('/guest')
  const redis = RedisDB.getInstance()
  channelNamespace.on('connection', (socket) => {
    socket.once('tokenCheck', async (sender) => {
      const mainUserID = String(sender.userID).substring(0, String(sender.userID).indexOf('+'))

      const userOnCache = await redis.client.get(`connection:${mainUserID}`)
      const mainUserParsed = JSON.parse(userOnCache)

      if (userOnCache === null || mainUserParsed.status === 'offline') return socket.emit('tokenCheckFailed', { message: 'Error please login on your main acount.' })
      const namespace = io.of(mainUserParsed.path)
      const socketTarget = namespace.sockets.get(mainUserParsed.socket)
      if (socketTarget) namespace.to(mainUserParsed.socket).emit('tokenChecker', 'KELOKE')
    })
  })
}

module.exports = setupGuestLoginNamespace
