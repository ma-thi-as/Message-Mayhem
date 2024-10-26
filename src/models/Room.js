const { Model } = require('./BaseModel')

class Room extends Model {
  constructor (data, _accessToken = null, _refreshToken = null, state = null) {
    super() // initializate Model class
    this.room_id = this.required(data.room_id, 'room_id')
    this.room_name = this.required(data.room_name, 'room_name')
    this.room_description = this.required(data.room_description, 'room_description')
  };
};

module.exports = {
  Room
}
