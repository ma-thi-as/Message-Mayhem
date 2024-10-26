class Model {
  required (value, attr) {
    if (value == null || value === undefined || value === '') {
      throw new Error(`Field ${attr} is required can't be null or empty`)
    }
    return value
  }
}

module.exports = {
  Model
}
