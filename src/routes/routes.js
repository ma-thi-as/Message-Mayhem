const express = require('express')
const port = process.env.PORT || 3000
const cors = require('cors')
const router = express.Router()
const authRoutes = require('./auth')
const channelRoutes = require('./channel')
const { ensureAuthenticated } = require('../auth/auth')
const { getBy, getAllDocuments, insertManyDocuments, deleteDocument } = require('../db/mongodb/atlas')
const { RedisDB } = require('../db/redis/redis')

const { UUID } = require('mongodb')
const originUrl = port === '3001' ? 'http://localhost:3001/' : 'https://new-aeriell-only-me-17f865b7.koyeb.app/'
//
// Define your routes here
//
router.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'autoplay=()')
  next()
})

router.use(cors({
  origin: originUrl,
  methods: ['GET', 'POST'],
  credentials: true
}))

router.get('/', function (req, res) {
  res.render('index', { user: req.user })
})

router.get('/home', ensureAuthenticated, async (req, res) => {
  const { userID, username } = req.user
  let isGuest = false
  let isAnon = false
  if (req.user.user) isGuest = true
  if (String(req.user.username).indexOf('anonymous') === 0) isAnon = true
  res.render('home', { user: { userID, username, isGuest, isAnon }, originUrl })
})

router.get('/get/friend/:friendUsername', ensureAuthenticated, async (req, res) => {
  const redis = RedisDB.getInstance()
  const username = req.params.friendUsername
  const getFriend = await getAllDocuments('guests', { 'user.username': { $regex: String(username), $options: 'i' } })
  const getAnonUsers = await redis.client.keys(`username:${username}*`)
  const matches = []

  if (getAnonUsers.length > 0) {
    for (let i = 0; i < getAnonUsers.length; i++) {
      const getUDetails = await redis.client.get(getAnonUsers[i])
      matches.push(JSON.parse(getUDetails))
    }
  }
  if (getFriend.length > 0) {
    for (let i = 0; i < getFriend.length; i++) {
      const { user: { username, userID } } = getFriend[i]
      const restructuringUser = { _id: getFriend[i]._id, username, userID }
      if (matches.length === 0) matches.push(restructuringUser)
      matches.forEach(e => {
        if (e.userID !== userID) {
          matches.push(restructuringUser)
        }
      })
    }
  }
  res.status(200).json({ userMatch: matches })
})

router.get('/get-mongo/friends', ensureAuthenticated, async (req, res) => {
  const cachedFriends = []
  const friends = await getAllDocuments('friends', { user: req.user.userID })
  if (friends.length > 0) {
    const friendsIds = friends.filter(e => e.friend !== req.user.userID).map(e => e.friend)
    const friendList = await getAllDocuments('users', { userID: { $in: friendsIds } })
    const redis = RedisDB.getInstance()
    for (let i = 0; i < friendList.length; i++) {
      const cachedFriend = Object.assign({}, await redis.client.hGetAll(`connection:${friendList[i].userID}`))
      if (cachedFriend.userID) cachedFriends.push(cachedFriend)
      else {
        friendList[i].status = 'offline'
        cachedFriends.push(friendList[i])
      }
    }
  }
  return res.status(200).json({ MongoFriends: cachedFriends })
})

router.get('/get-redis/friends', ensureAuthenticated, async (req, res) => {
  const cachedFriends = []
  const redis = RedisDB.getInstance()
  const friends = await redis.client.keys(`friends:${req.user.userID}/*`)
  if (friends && friends.length > 0) {
    for (let i = 0; i < friends.length; i++) {
      const friendShipDetails = Object.assign({}, await redis.client.hGetAll(friends[i]))
      if (friendShipDetails.user) {
        const friend = Object.assign({}, await redis.client.hGetAll(`connection:${friendShipDetails.friend}`))
        if (friend.userID) cachedFriends.push(friend)
        else {
          const anonUser = await redis.client.get(`anonymous-user:${friendShipDetails.friend}`)
          const parsedAnon = JSON.parse(anonUser)
          if (parsedAnon && parsedAnon.userID) {
            parsedAnon.status = 'offline'
            cachedFriends.push(parsedAnon)
          }
        }
      }
    }
  }
  return res.status(200).json({ RedisFriends: cachedFriends })
})

router.post('/add/friend', ensureAuthenticated, async (req, res) => {
  const { userID, username } = req.body
  const loggedUser = req.user
  const areFriends = await getBy('friends', { user: loggedUser.userID, friend: userID })

  if (!areFriends) {
    if ((String(username).includes('anonymous-') && String(username).length === 15 && UUID.isValid(userID)) ||
    (String(req.user.username).includes('anonymous-') && String(req.user.username).length === 15 && UUID.isValid(req.user.userID))) {
      const redis = RedisDB.getInstance()
      const redisQ = await redis.client.hGetAll(`friends:${req.user.userID}/${userID}`)

      const areFriendsR = Object.assign({}, redisQ)
      if (areFriendsR.user) return res.status(400).json({ Message: 'Alredy are friends' })
      else {
        const [addAnonFriend, addAnExp, addMeAnonFriend, addMExp] = await Promise.all([redis.client.hSet(`friends:${req.user.userID}/${userID}`, { user: req.user.userID, friend: userID }), redis.client.expire(`friends:${req.user.userID}/${userID}`, 10800), redis.client.hSet(`friends:${userID}/${req.user.userID}`, { user: userID, friend: req.user.userID }), redis.client.expire(`friends:${userID}/${req.user.userID}`, 10800)
        ])
        console.log(await redis.client.ttl(`friends:${req.user.userID}/${userID}`))
        console.log(await redis.client.ttl(`friends:${userID}/${req.user.userID}`))

        if (addAnonFriend && addAnExp && addMeAnonFriend && addMExp) return res.status(200).json({ Message: 'OK' })
      }
    } else {
      const addFriend = await insertManyDocuments('friends', [{ user: req.user.userID, friend: userID }, { user: userID, friend: req.user.userID }])
      if (addFriend) return res.status(200).json({ Message: 'OK' })
    }
    return res.status(200).json({ Message: 'Ok' })
  } else return res.status(400).json({ Message: 'Alredy are friends' })
})

router.post('/del/friend', ensureAuthenticated, async (req, res) => {
  const { userID, isAnon } = req.body
  // Delete mongo relation
  if (isAnon === false && req.user.isAnon === undefined) {
    const checkFriendship = await getBy('friends', { user: req.user.userID, friend: userID })
    const checkFriendFriendship = await getBy('friends', { user: userID, friend: req.user.userID })
    console.log(checkFriendship, checkFriendship)
    if (!checkFriendship || !checkFriendFriendship) return res.status(400).json({ Message: 'Not are friends MONGO' })
    await deleteDocument('friends', { _id: checkFriendship._id })
    await deleteDocument('friends', { _id: checkFriendFriendship._id })
    return res.status(200).json({ Message: 'OK' })
  }
  // Delete redis relation
  const redis = RedisDB.getInstance()
  const checkMeAnonFriendship = await redis.client.hGetAll(`friends:${req.user.userID}/${userID}`)
  const checkFriendAnonFriendship = await redis.client.hGetAll(`friends:${userID}/${req.user.userID}`)
  if (!checkMeAnonFriendship || !checkFriendAnonFriendship) return res.status(400).json({ Message: 'Not are friends REDIS' })

  const delFriendAnonFriendship = await redis.client.hGetAll(`friends:${userID}/${req.user.userID}`)
  const delMeAnonFriendship = await redis.client.hGetAll(`friends:${req.user.userID}/${userID}`)
  if (delMeAnonFriendship && delFriendAnonFriendship) {
    await Promise.all([redis.client.del(`friends:${userID}/${req.user.userID}`), redis.client.del(`friends:${req.user.userID}/${userID}`)])

    return res.status(200).json({ Message: 'OK ' })
  } else return res.status(400).json({ Message: 'Not are friends' })
}
)

router.get('/get/messages/:roomID', ensureAuthenticated, async (req, res) => {
  const roomID = req.params.roomID
  const redis = RedisDB.getInstance()
  const msgs = []
  const getMessages = await redis.client.lRange(`messages:${roomID}`, 0, -1)
  if (getMessages.length === 0) return res.status(200).json({ allMsgs: msgs })
  for (let index = 0; index < getMessages.length; index++) {
    if (index < 3) {
      const element = getMessages[index]
      msgs.push(JSON.parse(element))
    } else return
  }
  return res.status(200).json({ allMsgs: msgs })
})

router.get('/get/messages/details/:userID/:roomID', ensureAuthenticated, async (req, res) => {
  const userID = req.params.userID
  const roomID = req.params.roomID ? req.params.roomID : '*'
  const msgs = []
  const redis = RedisDB.getInstance()
  const getMessages = await redis.client.keys(`messages:${roomID}/${userID}`)
  if (getMessages.length === 0) return res.status(200).json({ Msgs: msgs })
  for (let index = 0; index < getMessages.length; index++) {
    const element = getMessages[index]
    const msg = Object.assign({}, JSON.parse(await redis.client.get(element)))
    console.log(msg)
    if (msg) msgs.push(msg)
  }

  return res.status(200).json({ Msgs: msgs })
})

router.use('/', authRoutes)
router.use('/', channelRoutes)
module.exports = router
