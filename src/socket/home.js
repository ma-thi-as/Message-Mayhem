const { insertQuery, getBy, getAllDocuments } = require('../db/mongodb/atlas')
const { RedisDB } = require('../db/redis/redis')
const { Room } = require('../models/RoomModel')
const { onlyForHandshake } = require('./init')

const setupHomeNamespace = (io, sessionConfig, passport) => {
  const homeNamespace = io.of('/home')
  // Middlewares
  homeNamespace.use(onlyForHandshake((socket, next) => sessionConfig(socket.request, {}, next)))
  homeNamespace.use(onlyForHandshake((socket, next) => passport.session()(socket.request, {}, next)))

  homeNamespace.use(
    onlyForHandshake((socket, next) => {
      if (socket.request.user) {
        next()
      } else {
        next(new Error('Unauthorized'))
      }
    })
  )

  const redis = RedisDB.getInstance()
  const DOCUMENT_NAME = 'connection:'
  homeNamespace.on('connection', async (socket) => {
    socket.request.user.date = new Date().toLocaleString().toString()
    socket.request.user.status = 'online'
    socket.request.user.path = socket.nsp.name

    try {
      const { userID, username, date, status, path } = socket.request.user
      await redis.client.set(`username:${username}`, JSON.stringify({ socket: socket.id, userID, username, date, status, path }, null, 2))
      await redis.client.hSet(`${DOCUMENT_NAME}${socket.request.user.userID}`, { socket: socket.id, userID, username, date, status, path })
      await redis.client.expire(`${DOCUMENT_NAME}${socket.request.user.userID}`, 10800)
    } catch (e) {
      console.error('Error setting the object on redis db: ', e)
    }

    const fetchedSockets = await socket.nsp.fetchSockets()

    socket.emit('my-connection', { socket: socket.id, user: socket.request.user })
    fetchedSockets.filter(e => e.request.user.userID !== socket.request.user.userID).map(e => {
      const element = { socket: e.id, user: e.request.user }
      socket.to(element.socket).emit('new-connection', { sender: { socket: socket.id, user: socket.request.user }, receptor: element })
      return e
    })

    socket.on('update-friends', (receptor, isDel) => {
      console.log(receptor, socket.id)
      socket.nsp.to(socket.id).emit('update-friends', receptor, isDel)
      socket.nsp.to(receptor.socket).emit('update-friends', { socket: socket.id, user: socket.request.user }, isDel)
    })

    socket.on('requestCall', async (e) => {
      const { friend, sender } = e
      const senderFormatted = { socket: sender.socket, userID: sender.user.userID, username: sender.user.username, date: sender.user.date, status: sender.user.status, path: sender.user.path }
      socket.to(friend.socket).emit('incomingCall', { sender: senderFormatted, receptor: friend })
    })

    socket.on('acceptedCall', async (e) => {
      const { responseSender, callMaker } = e
      console.log(responseSender, callMaker)
      const baseUsers = [responseSender, { socket: callMaker.socket, userID: callMaker, username: callMaker.username, date: callMaker.date, status: callMaker.status, path: callMaker.path }]
      const redis = RedisDB.getInstance()
      const room = new Room(`${callMaker.username} room's`, baseUsers)
      room.status = true
      const newRoom = await insertQuery('rooms', room)
      const { roomName, creationDate, status, endDate, users } = newRoom

      await redis.client.hSet(`${newRoom._id}`, { roomName, creationDate: JSON.stringify(creationDate), status: JSON.stringify(status), endDate: JSON.stringify(endDate), users: JSON.stringify(users) })

      baseUsers.map(e => {
        socket.nsp.to(e.socket).emit('newRoom', { _id: newRoom._id })
        return e
      })
    })

    socket.on('disconnect', async () => {
      socket.request.user.status = 'offline'
      socket.request.user.path = socket.nsp.name
      try {
        const getter = await redis.client.hGetAll(`${DOCUMENT_NAME}${socket.request.user.userID}`)

        if ((getter.userID && getter.status === 'online') || socket.request.isAuthenticated() === false) {
          const parsedObj = getter
          parsedObj.status = 'offline'
          await redis.client.hSet(`${DOCUMENT_NAME}${socket.request.user.userID}`, parsedObj)

          await redis.client.expire(`${DOCUMENT_NAME}${socket.request.user.userID}`, 10800)
          const fetchSockets = await socket.nsp.fetchSockets()

          fetchSockets.filter(e => e.request.user.userID !== socket.request.user.userID).map(e => {
            const element = { socket: e.id, user: e.request.user }
            socket.to(element.socket).emit('disconnection', { receptor: { socket: socket.id, user: socket.request.user }, sender: parsedObj })
            return e
          })

          socket.emit('disconnection', {})
        } else {
          console.log('Key does not exist.')
        }
      } catch (error) {
        console.error('Error updating Redis:', error)
      }
    })
    return homeNamespace
  })
}

module.exports = setupHomeNamespace
