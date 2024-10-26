// Extract URL parameters
const getUrlParam = () => {
  const parts = window.location.href.split('/channel')
  return parts[1]?.replace('/', '') || ''
}
const fetchEnv = async () => {
  console.log('perico')
  try {
    const request = await fetch('/channel-variables')
    const response = await request.json()
    if (request.status === 200) return await response
    else return { 'Error: ': "Can't connect with the server" }
  } catch (e) {
    console.error('Error getting required params', e.message)
  }
}
// Initialize global variables

let socket = null

if (!window.socket) {
  window.socket = io(`/channel:${getUrlParam()}`, {
    transports: ['websocket'],
    upgrade: false
  })
}
socket = window.socket

const msgRender = (userID, msg, sender) => {
  const msgContainer = document.getElementById('msg-container')

  // Create a message wrapper for sent and received messages
  const messageWrapper = document.createElement('div')
  messageWrapper.className = 'block grid'

  // Check if the message is sent or received
  if (sender.userID === userID) {
    // For sent messages
    messageWrapper.className += ' justify-end'
    messageWrapper.id = 'sended-msg'

    // Create a message element
    const sentMessage = document.createElement('article')
    sentMessage.className = 'bg-blue-200 text-black p-2 rounded-lg mt-2 text-pretty max-w-xl'
    sentMessage.innerHTML = msg // Set the message content

    messageWrapper.appendChild(sentMessage)
  } else {
    // For received messages
    messageWrapper.id = 'received-msg'

    // Create a header for the sender's username
    const senderHeader = document.createElement('header')
    senderHeader.className = 'bg-gray-300 px-2 italic rounded-t-lg w-fit'
    senderHeader.innerHTML = sender.username // Set the sender's username

    // Create a message element
    const receivedMessage = document.createElement('article')
    receivedMessage.className = 'bg-gray-300 p-2 rounded-b-lg rounded-tr-lg text-pretty max-w-xl text-black'
    receivedMessage.innerHTML = msg // Set the message content

    messageWrapper.appendChild(senderHeader)
    messageWrapper.appendChild(receivedMessage)
  }

  // Append the message wrapper to the container
  msgContainer.appendChild(messageWrapper)
}

async function messagesHandler () {
  const currentLoggedUser = document.querySelector('script[data-current]').getAttribute('data-current')
  const { username, userID } = JSON.parse(currentLoggedUser)
  const roomID = window.location.href.substring(window.location.href.lastIndexOf('/') + 1, window.location.href.length)
  const getRoomMsgs = await fetch(`/get/messages/${roomID}`)
  const { allMsgs } = await getRoomMsgs.json()

  if (getRoomMsgs.status === 200) {
    for (let index = 0; index < allMsgs.length; index++) {
      const element = allMsgs[index]
      msgRender(userID, element.msg, element.sender)
    }
  }

  const mForm = document.getElementById('messages-form')
  mForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const inputText = e.target.querySelector('input').value
    if (inputText.trim() !== '') {
      socket.emit('chat-msg-sender', { msg: inputText, sender: { username, userID } })
      e.target.querySelector('input').value = ''
    }
  })

  socket.on('chat-msg-receiver', (data) => {
    const { msg, sender } = data
    msgRender(userID, msg, sender)
  })
}

const peerConns = []

async function initializerP2P (sender, receiver) {
  const { stunServer, turnServer, credential, password } = await fetchEnv()
  const configuration = {
    iceServers: [
      { urls: stunServer },
      { urls: turnServer, username: credential, credential: password }
    ]
  }
  const pc = new RTCPeerConnection(configuration)

  // Create data channel
  const dataChannel = pc.createDataChannel('nsp')

  // Get user media (audio)
  const constraints = { audio: true, video: false }
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  stream.getTracks().forEach(track => pc.addTrack(track, stream))

  // Store the peer connection
  peerConns.push({ socketID: receiver.socketID, pc, iceQueue: [], dataChannel, stream })

  // Handle ICE candidate events
  pc.addEventListener('icecandidate', ev => {
    if (ev.candidate) {
      socket.emit('new-ice', ev.candidate, sender, receiver)
    }
  })

  // Handle connection state changes
  pc.addEventListener('connectionstatechange', ev => {
    console.log('Connection state is', pc.connectionState)
    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      console.warn('Peer connection state failed or disconnected for', receiver.socketID)
    }
  })

  // Monitor ICE connection state changes
  pc.addEventListener('iceconnectionstatechange', ev => {
    console.log('ICE connection state is', pc.iceConnectionState)
    if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
      console.warn('ICE connection failed for', receiver.socketID)
      cleanupPeerConnection(receiver.socketID) // Clean up only for this peer
    }
  })

  // Handle remote tracks (audio in this case)
  pc.addEventListener('track', async (event) => {
    console.log('Remote track received from', receiver.socketID)
    const aContainer = document.getElementById('audio-container')
    const remoteAudio = document.createElement('audio')
    remoteAudio.id = receiver.user.userID
    aContainer.appendChild(remoteAudio)
    const [remoteStream] = event.streams
    remoteAudio.srcObject = remoteStream
    remoteAudio.play()
  })

  dataChannel.onopen = () => {
    console.log('Data channel is open with', receiver.socketID)
    if (pc.iceConnectionState === 'connected') {
      dataChannel.send('AFGAS') // Ensure ICE is stable before sending data
    } else {
      console.log('Waiting for ICE connection to stabilize before sending data.')
    }
  }

  return pc
}

function cleanupPeerConnection (socketID) {
  const peer = peerConns.find(e => e.socketID === socketID)
  if (peer) {
    peer.pc.close() // Close the peer connection
    // Remove the peer from the list of connections
    peerConns.splice(peerConns.findIndex(e => e.socketID === socketID), 1)
    console.log(`Peer connection with ${socketID} has been cleaned up`)
  }
}

function main () {
  // Listen for request to initialize P2P connection
  socket.on('start-signal-response', async (sender, receptor) => {
    const pc = await initializerP2P(receptor, sender)
    const offer = await pc.createOffer({ iceRestart: true })
    await pc.setLocalDescription(offer)
    pc.addEventListener('icegatheringstatechange', ev => {
      if (pc.iceGatheringState === 'complete') {
        socket.emit('offer', { offer }, receptor, sender)
      }
    })
  })

  socket.on('start-signal', async (sender, receptors) => {
    for (let i = 0; i < receptors.length; i++) {
      socket.emit('start-signal-response', sender, receptors[i])
      await initializerP2P(sender, receptors[i])
    }
  })

  socket.on('add-ice', async (candidate, sender, receptor) => {
    setTimeout(async () => {
      const peer = peerConns.find(e => e.socketID === sender.socketID)
      const pc = peer.pc

      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(candidate)
      } else {
        peer.iceQueue.push(candidate)
      }
    }, 1000)
  })

  socket.on('offer', async (offer, sender, receptor) => {
    setTimeout(async () => {
      const peer = peerConns.find(e => e.socketID === sender.socketID)

      const pc = peer.pc

      await pc.setRemoteDescription(new RTCSessionDescription(offer.offer))
      peer.iceQueue.forEach(async candidate => {
        await pc.addIceCandidate(candidate)
      })
      peer.iceQueue = []

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { answer }, receptor, sender)
    }, 600)
  })

  socket.on('answer', async (answer, sender, receptor) => {
    const peer = peerConns.find(e => e.socketID === sender.socketID)
    const pc = peer.pc
    const remoteDesc = new RTCSessionDescription(answer.answer)

    await pc.setRemoteDescription(remoteDesc)
    peer.iceQueue.forEach(async candidate => {
      await pc.addIceCandidate(candidate)
    })
    peer.iceQueue = []
  })

  // Handle client disconnection
  socket.on('clientDisconnected', (data) => {
    const peer = peerConns.find(e => e.socketID === data.id)
    if (peer) {
      console.log(`Client ${data.id} disconnected, cleaning up connection`)
      cleanupPeerConnection(data.id) // Clean up only the disconnected client's connection
    }
  })
}

main()
messagesHandler()
