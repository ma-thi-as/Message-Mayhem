const { RedisDB } = require('../db/redis/redis')

const setupInitNamespace = (io) => {

  const actualUsers = []
  const socketAdder = (socket) => {
    if (socket.id in actualUsers) return 0
    else {
      actualUsers.push()
    }
  }
  const socketRemover = (socket) => {
    if (socket.id in actualUsers) actualUsers.splice(0)
  }
  const socketGetter = () => {
    const homeNS = io.of('/home')
    homeNS.on('connection', async socket => {
      
      socket.on('disconnect', async (ev) => {
             })
    })
    const channelNS = io.of(/^\/channel:[a-zA-Z0-9_]+$/)
    channelNS.on('connection', async (socket) => {
      delete socket.request.user.isConnected
      socket.request.user.date = new Date().toLocaleString().toString()
      socket.request.user.status = 'online'

      await redis.client.set(`${DOCUMENT_NAME}${socket.request.user.userID}`, JSON.stringify(socket.request.user, 2, null))

      socket.on('disconnect', async (ev) => {
        try {
          const getter = await redis.client.get(`${DOCUMENT_NAME}${socket.request.user.userID}`)
          if (getter) {
            const parsedObj = JSON.parse(getter)
            parsedObj.status = 'offline'
            await redis.client.set(`${DOCUMENT_NAME}${socket.request.user.userID}`, JSON.stringify(parsedObj))
          } else {
            console.log('Key does not exist.')
          }
        } catch (error) {
          console.error('Error updating Redis:', error)
        }
      })
    })
  }
  socketGetter()
}
module.exports = setupInitNamespace
