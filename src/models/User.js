class User {
  constructor (userID, username, _accessToken = null, _refreshToken = null) {
    this.userID = userID
    this.username = username
    this._accessToken = _accessToken
    this._refreshToken = _refreshToken
  }
}

module.exports = {
  User
}
