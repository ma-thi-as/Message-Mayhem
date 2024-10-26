require('dotenv').config()
const { MongoClient, ServerApiVersion, MongoTopologyClosedError } = require('mongodb')
const user = process.env.ATLAS_USER
const password = process.env.ATLAS_PASSWORD
const __dbName = process.env.DB_NAME
const cluster = process.env.ATLAS_CLUSTER
const uri = `mongodb+srv://${user}:${password}@${cluster}/?retryWrites=true&w=majority&appName=discordcluster?directConnection=true`
const DATABASES_NAME = { testing: 'test-db', prod: 'production' }

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

async function getConnections (_envDbName = __dbName) {
  const matchedDatabases = []
  const connections = []
  await client.connect()

  try {
    const adminDbs = await client.db().admin().listDatabases()
    if (_envDbName !== undefined && typeof _envDbName === 'string') {
      connections[_envDbName] = connections.push(
        client.db(_envDbName)
      )
    }
    // check correct db
    for (const key in DATABASES_NAME) {
      if (DATABASES_NAME[key] == null) getConnections()
      adminDbs.databases.filter(db => db.name === DATABASES_NAME[_envDbName])
        .map(db => matchedDatabases.push(db.name))
    };

    for (const dbName of matchedDatabases) {
      await client.db(dbName).command({ ping: 1 })
      connections[dbName] = client.db(dbName)
      console.log(`Pinged your DATABASE : ${dbName}. You successfully connected to MongoDB!`)
    };

    return connections[0]
  } catch (e) {
    if (e instanceof MongoTopologyClosedError) {
      return await getConnections()
    }
  }
}

module.exports = {
  getConnections,
  client
}
