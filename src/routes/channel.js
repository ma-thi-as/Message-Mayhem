const express = require('express')
const { ensureAuthenticated } = require('../auth/auth')
const { getBy, getFilteredDocuments, insertQuery } = require('../db/mongodb/atlas')

const { Room } = require('../models/RoomModel')
const { RedisDB } = require('../db/redis/redis')
const { ObjectId } = require('mongodb')
const router = express.Router()

router.post('/api/new_room', async (req, res) => {
  const { roomName, endDate, users } = req.body
  const parsedDate = Date.parse(endDate)
  if (String(roomName).trim() === '' || !roomName) return res.status(400).json({ roomName: 'must be valid value' })

  if (Array(users).length === 0 || !users) return res.status(400).json({ users: 'must be not empty' })

  if (!parsedDate) return res.status(400).json({ endDate: 'must be valid date in format ISO 8601' })

  const room = new Room(roomName, new Date(parsedDate), users)
  const newRoom = await insertQuery('rooms', room)
  console.log('ROROMRORMO')
  res.status(200).json(newRoom)
})

router.get('/channel/:roomId', ensureAuthenticated, async (req, res) => {
  const { userID, username } = req.user
  const roomID = req.params.roomId

  const roomExists = await getBy('rooms', { _id: new ObjectId(roomID) })
  console.log(roomExists)
  if (!roomExists) return res.render('error', { Messsage: 'Not found' })
  roomExists.users.forEach(e => {
    if (e.userID !== userID) roomExists.users.push()
  })

  res.render('room', { user: { userID, username }, params: '' })
})

router.get('/channel-variables', ensureAuthenticated, (req, res) => {
  const { STUNSERVER, TURNSERVER, TURNCREDENTIALS, TURNPASSWORD } = process.env
  res.json({ stunServer: STUNSERVER, turnServer: TURNSERVER, credential: TURNCREDENTIALS, password: TURNPASSWORD })
})

module.exports = router
