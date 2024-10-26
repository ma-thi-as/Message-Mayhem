class Room {
  constructor (roomName, users) {
    this.roomName = roomName
    this.creationDate = new Date(Date.now())
    this.status = false
    this.endDate = null
    this.users = users
  }
}

module.exports = {
  Room
}
