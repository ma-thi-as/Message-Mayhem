require('dotenv').config()

const { createClient } = require('redis')

const serverStr = process.env.REDISSV

class RedisDB {
  constructor () {
    this.client = createClient({
      url: serverStr
    })
    this.client.on('error', (err) => console.error('Redis Client Error', err))

    this.client.connect().then(() => {
    }).catch(err => {
      console.error('Redis connection error:', err)
    })
  };

  static getInstance () {
    if (!RedisDB.instance) {
      RedisDB.instance = new RedisDB()
    };
    return RedisDB.instance
  };

  async insertMapElement (key, data) {
    try {
      const query = await this.client.hSet(key, data)
      console.log(query)
      return JSON.stringify({ [key]: data }, null, 2)
    } catch (err) {
      console.error('Error inserting map element:', err)
      throw err
    };
  };

  async selectElement (patternWithKey) {
    try {
      const cacheData = await this.client.hGetAll(patternWithKey)
      return JSON.stringify(cacheData, null, 2)
    } catch (err) {
      console.error('Error selecting element:', err)
      throw err
    };
  };

  async getAllElements (pattern) {
    let cursor = 0
    const keys = []
    try {
      do {
        const reply = await this.client.scan(cursor, { MATCH: pattern })
        cursor = reply.cursor
        reply.keys.map((el) => keys.push(el))
      } while (cursor !== 0)

      const objsPromises = keys.map(async (element) => {
        const query = await this.client.hGetAll(`${element}`)
        return JSON.parse(JSON.stringify(query, null, 2))
      })
      const objs = await Promise.all(objsPromises)
      return objs
    } catch (error) {
      console.error('Error: ', error)
      throw error
    }
  };

  async deleteElement (key) {
    try {
      if (Array.isArray(key)) {
        const promises = key.map(key => this.client.del(key))
        const results = await Promise.all(promises)

        const allDeleted = results.every(result => result > 0)
        return allDeleted ? 'Deleted' : 'Not All Exist'
      } else {
        const query = await this.client.del(key)
        return query === 0 ? 'Not Exists' : 'Deleted'
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  };
};
module.exports = {
  RedisDB
}
