const session = require('express-session')
const { MongoClient, ServerApiVersion } = require('mongodb')
const user = process.env.ATLAS_USER
const password = process.env.ATLAS_PASSWORD
const __dbName = process.env.DB_NAME
const cluster = process.env.ATLAS_CLUSTER
const uri = `mongodb+srv://${user}:${password}@${cluster}/?retryWrites=true&w=majority&appName=discordcluster`

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

client.connect()

class MongoDBStore extends session.Store {
  constructor (options) {
    super()
    this.client = options.client
    this.db = this.client.db(options.dbName)
    this.collection = this.db.collection(options.collectionName)
  }

  async get (sid, callback) {
    try {
      const session = await this.collection.findOne({ _id: sid })
      callback(null, session ? session.session : null)
    } catch (err) {
      callback(err)
    }
  }

  async set (sid, session, callback) {
    try {
      const maxAge = session.cookie.maxAge
      const expires = maxAge ? new Date(Date.now() + maxAge) : null
      await this.collection.updateOne(
        { _id: sid },
        { $set: { session, expires } },
        { upsert: true }
      )
      callback(null)
    } catch (err) {
      callback(err)
    }
  }

  async destroy (sid, callback) {
    try {
      await this.collection.deleteOne({ _id: sid })
      callback(null)
    } catch (err) {
      callback(err)
    }
  }

  async touch (sid, session, callback) {
    try {
      const maxAge = session.cookie.maxAge
      const expires = maxAge ? new Date(Date.now() + maxAge) : null
      await this.collection.updateOne(
        { _id: sid },
        { $set: { expires } }
      )
      callback(null)
    } catch (err) {
      callback(err)
    }
  }
}

const sessionStore = new MongoDBStore({
  client,
  dbName: __dbName,
  collectionName: 'sessions'
})

const sessionConfig = session({
  cookie: {
    maxAge: 1000 * 60 * 60,

  },
  store: sessionStore,
  resave: false,
  secret: 'keyboard cat',
  saveUninitialized: false
})

module.exports = sessionConfig
