const { RedisDB } = require('../db/redis/redis')
const { onlyForHandshake } = require('./init')
const setupChannelNamespace = (io, sessionConfig, passport) => {
  const channelNamespace = io.of(/^\/channel:[a-zA-Z0-9_]+$/)
  channelNamespace.use(onlyForHandshake((socket, next) => sessionConfig(socket.request, {}, next)))
  channelNamespace.use(onlyForHandshake((socket, next) => passport.session()(socket.request, {}, next)))

  channelNamespace.use(
    onlyForHandshake((socket, next) => {
      if (socket.request.user) {
        next()
      } else {
        next(new Error('Unauthorized')) // Throw an error if not authorized
      }
    })
  )

  channelNamespace.on('connection', async (socket) => {
    const currentNs = socket.nsp
    const fetchSockets = await currentNs.fetchSockets()
    const socketGetter = (param = null) => {
      if (!param) return fetchSockets.filter(e => e.id === param).map(e => { return { socketID: e.id, user: e.request.user } })
      else {
        return fetchSockets.filter(e => e.id !== param).map(e => { return { socketID: e.id, user: e.request.user } })
      }
    }

    socket.emit('start-signal', { socketID: socket.id, user: socket.request.user }, socketGetter(socket.id))

    socket.on('start-signal-response', (sender, receiver) => {
      console.log(receiver.socketID, socket.id)
      socket.to(receiver.socketID).emit('start-signal-response', sender, receiver)
    })

    socket.on('new-ice', (candidate, sender, receiver) => {
      socket.nsp.to(receiver.socketID).emit('add-ice', candidate, sender, receiver)
    })

    socket.on('offer', (offer, sender, receiver) => {
      console.log(sender, receiver)
      socket.nsp.to(receiver.socketID).emit('offer', offer, sender, receiver)
    })

    socket.on('answer', (answer, sender, receiver) => {
      console.log(sender, receiver)
      socket.nsp.to(receiver.socketID).emit('answer', answer, sender, receiver)
    })

    socket.on('chat-msg-sender', async (data) => {
      console.log(`Message received in namespace ${socket.nsp.name}: ${data.msg}`)
      const redis = RedisDB.getInstance()
      const { userID, username } = data.sender
      const roomID = String(socket.nsp.name).substring(String(socket.nsp.name).indexOf(':') + 1, String(socket.nsp.name).length)
      const currentDate = new Date().toLocaleString().toString()

      // Msgs of the room
      await redis.client.rPush(`messages:${roomID}`, JSON.stringify({ msg: String(data.msg), sender: { userID, username }, date: currentDate }))

      socket.nsp.emit('chat-msg-receiver', { msg: data.msg, sender: data.sender })

      // Msgs of the user  in the room
      const sendedMessages = [{ msg: String(data.msg), date: currentDate }]
      const checkSendedMsgs = JSON.parse(await redis.client.get(`messages:${roomID}/${userID}`))
      if (checkSendedMsgs) Array.from(checkSendedMsgs.msgs).map(e => sendedMessages.push(e))
      await redis.client.set(`messages:${roomID}/${userID}`, JSON.stringify({ msgs: sendedMessages, room: roomID }))
    })

    socket.on('disconnect', (reason) => {
      console.log(`Socket ${socket.id} disconnected: ${reason}`)
      socket.broadcast.emit('clientDisconnected', { id: socket.id })
    })
  })
}

module.exports = setupChannelNamespace
