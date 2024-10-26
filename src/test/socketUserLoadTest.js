const test = require('tape')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const ioc = require('socket.io-client')

let io, serverSocket, clientSocket

function waitFor (socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve)
  })
}

test('setup', (t) => {
  const httpServer = createServer()
  io = new Server(httpServer)
  httpServer.listen(() => {
    const port = httpServer.address().port
    clientSocket = ioc(`http://localhost:${port}`)
    io.on('connection', (socket) => {
      serverSocket = socket
    })
    clientSocket.on('connect', t.end)
  })
})

test('it works', (t) => {
  t.plan(1)
  clientSocket.on('hello', (arg) => {
    t.equal(arg, 'world')
  })
  serverSocket.emit('hello', 'world')
})

test('it works with an acknowledgement', (t) => {
  t.plan(1)
  serverSocket.on('hi', (cb) => {
    cb('hola')
  })
  clientSocket.emit('hi', (arg) => {
    t.equal(arg, 'hola')
  })
})

test('it works with emitWithAck()', async (t) => {
  t.plan(1)
  serverSocket.on('foo', (cb) => {
    cb('bar')
  })
  const result = await clientSocket.emitWithAck('foo')
  t.equal(result, 'bar')
})

test('it works with waitFor()', async (t) => {
  t.plan(1)
  clientSocket.emit('baz')

  await waitFor(serverSocket, 'baz')
  t.pass()
})

test.onFinish(() => {
  io.close()
  clientSocket.disconnect()
})
