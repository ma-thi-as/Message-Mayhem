const { client, getConnections } = require('./config')

const QueryConditional = {
  Or: '$or',
  And: '$and',
  Set: '$set',
  None: false
}
async function insertManyDocuments (collectionName, listOfDocs) {
  const connection = await getConnections()
  const query = await connection.collection(collectionName).insertMany(listOfDocs)
}
async function deleteDocument (collectionName, elementID) {
  let query
  const connection = await getConnections()
  try {
    query = await connection.collection(collectionName).deleteOne(elementID)
    return query
  } catch (e) {
    console.error(e)
  }
}

async function getAllDocuments (collectionName, finder = null) {
  let query
  const connection = await getConnections()
  if (finder === null) query = await connection.collection(collectionName).find().toArray()
  else query = await connection.collection(collectionName).find(finder).toArray()
  if (query) return query
}

async function getFilteredDocuments (collectionName, attrsToFilter, projection, conditional = QueryConditional.None) {
  try {
    const connection = await getConnections()
    const query = await connection.collection(collectionName).find(attrsToFilter, { projection }).toArray()
    return query
  } catch (error) {
    console.error(error)
  }
}

async function insertQuery (collectionName, data) {
  try {
    const connections = await getConnections()
    if (data.length === 0) throw 'Please provide data'
    try {
      const setData = await connections.collection(collectionName).insertOne(data)
      data._id = setData.insertedId.toString()
    } catch (e) {
      throw 'Error inserting data: ' + e
    }
  } catch (e) {
    throw 'Error stablish connection: ' + e
  }

  return data
}

/**
 * Updates a document in a MongoDB collection.
 *
 * @param {string} collectionName - The name of the MongoDB collection to update.
 * @param {Object} data - An object containing the updates to apply to the document. The first key-value pair in the object will be used as the filter to find the document to update.
 * @returns {Promise<Object>} - The updated document, or null if the document was not found.
 * @throws {Error} - If the document with the specified filter was not found.
 */
async function updateQuery (collectionName, filterOjb, data) {
  const connection = await getConnections()
  const updateDoc = await connection.collection(collectionName).findOneAndUpdate(filterOjb, data)
  return updateDoc
}

/**
 * Creates a filter object from the provided data object.
 *
 * @param {Object} data - An object containing the updates to apply to the document. The first key-value pair in the object will be used as the filter.
 * @returns {Object} - The filter object.
 */
function createFilterObject (data) {
  const filterKey = Object.keys(data)[0]
  const filterValue = data[filterKey]

  return { [filterKey]: filterValue }
}

async function getBy (collectionName, filterParams, projection, conditional = QueryConditional.None) {
  try {
    const connection = await getConnections()
    const query = projection ? await connection.collection(collectionName).findOne(filterParams, { projection }) : await connection.collection(collectionName).findOne(filterParams)
    return query
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  updateQuery,
  getBy,
  insertQuery,
  insertManyDocuments,
  getFilteredDocuments,
  getAllDocuments,
  deleteDocument,
  QueryConditional
}
