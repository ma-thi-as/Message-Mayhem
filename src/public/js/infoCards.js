const renderOnlineActive = async () => {
  const currentLoggedUser = document.querySelector('script[data-current]').getAttribute('data-current')
  const { userID } = JSON.parse(currentLoggedUser)

  const [mongoFriends, redisFriends] = await Promise.all([fetch('/get-mongo/friends'), fetch('/get-redis/friends')])
  let friends = []
  const [mongoRes, redisRes] = await Promise.all([mongoFriends.json(), redisFriends.json()])
  if (mongoFriends.status === 200 && redisFriends.status === 200) friends = [...mongoRes.MongoFriends, ...redisRes.RedisFriends]
  console.log(friends)

  const [myMsgDetails] = await Promise.all([fetch(`/get/messages/details/${userID}/*`)])
  const { Msgs } = await myMsgDetails.json()
  // days-hours-minutes-seconds-milisec 1 * 24 * 60 * 60 * 1000
  const sevenDaysAgo = new Date(Date.now() - 4 * 60 * 1000)
  const fourTeenDaysAgo = new Date(Date.now() - 8 * 60 * 1000)

  console.log(sevenDaysAgo, fourTeenDaysAgo)
  for (let index = 0; index < Msgs.length; index++) {
    const roomMsgs = Msgs[index]
    for (let e = 0; e < roomMsgs.length; e++) {
      const { date } = roomMsgs[e]
      const dateElem = new Date(date)
      console.log(dateElem)

      console.log(sevenDaysAgo < dateElem)
    }
  }
//  totalFriends.innerText = friends.length
}

document.addEventListener('DOMContentLoaded', async () => {
  await renderOnlineActive()
})

