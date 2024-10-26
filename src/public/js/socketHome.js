const socket = io('/home')

// Maneja la lógica para mostrar el modal cuando se reciba el evento 'incomingCall'
socket.on('incomingCall', (e) => {
  const modal = document.getElementById('static-modal')
  const modalHeader = document.getElementById('modal-header')
  const modalBody = document.getElementById('modal-body')
  const btnAccept = document.getElementById('button-accept')
  const btnDecline = document.getElementById('button-decline')
  modal.classList.remove('hidden')
  console.log(e)
  modalHeader.innerHTML = `Incomming call of ${e.sender.username}`
  modal.className += ' text-center'
  modalBody.innerHTML = ''

  btnAccept.classList.remove('hidden')
  btnAccept.innerHTML = 'Accept'
  btnDecline.innerHTML = 'Decline'
  btnAccept.addEventListener('click', (ev) => {
    socket.emit('acceptedCall', { responseSender: e.receptor, callMaker: e.sender })
  })
})

export const renderFriends = async (friendList, sender) => {
  const friendsDropMenu = document.getElementById('dropdown-menu')
  friendsDropMenu.innerHTML = ''
  if (friendList.length <= 0) { friendsDropMenu.innerHTML = '<span>Not friends yet</span>'; return friendsDropMenu }
  for (let i = 0; i < friendList.length; i++) {
    const friendElem = `<div id="friend-${friendList[i].userID}" class ="flex justify-evenly w-full">
            <p class=" relative w-2/3 flex  items-center text-sm text-white" data-meta=${friendList[i].userID}>
          <span class="">
<svg xmlns="http://www.w3.org/2000/svg" class="fill-white w-5" viewBox="0 0 512 512"><path class="fill-white"  d="M258.9 48C141.92 46.42 46.42 141.92 48 258.9c1.56 112.19 92.91 203.54 205.1 205.1 117 1.6 212.48-93.9 210.88-210.88C462.44 140.91 371.09 49.56 258.9 48zm126.42 327.25a4 4 0 01-6.14-.32 124.27 124.27 0 00-32.35-29.59C321.37 329 289.11 320 256 320s-65.37 9-90.83 25.34a124.24 124.24 0 00-32.35 29.58 4 4 0 01-6.14.32A175.32 175.32 0 0180 259c-1.63-97.31 78.22-178.76 175.57-179S432 158.81 432 256a175.32 175.32 0 01-46.68 119.25z"/><path d="M256 144c-19.72 0-37.55 7.39-50.22 20.82s-19 32-17.57 51.93C191.11 256 221.52 288 256 288s64.83-32 67.79-71.24c1.48-19.74-4.8-38.14-17.68-51.82C293.39 151.44 275.59 144 256 144z"/></svg>
  </span> ${String(friendList[i].username).length === 15 && String(friendList[i].username).includes('anonymous-') ? String(friendList[i].username).replace('ymous-', '...').toUpperCase() : String(friendList[i].username).toUpperCase()}
</p>
<div class="relative w-1/3">
<button class="">
        <svg xmlns="http://www.w3.org/2000/svg" class="ionicon w-5" viewBox="0 0 512 512"><path d="M408 64H104a56.16 56.16 0 00-56 56v192a56.16 56.16 0 0056 56h40v80l93.72-78.14a8 8 0 015.13-1.86H408a56.16 56.16 0 0056-56V120a56.16 56.16 0 00-56-56z" fill="orange" stroke="currentColor" stroke-linejoin="round" /><circle fill="white" cx="160" cy="216" r="32"/><circle  fill="white" cx="256" cy="216" r="32"/><circle  fill="white" cx="352" cy="216" r="32"/></svg>
        </button>
${friendList[i].status === 'online' ? `<button id="btn-call-${friendList[i].userID}" class="pointer-events-auto"> <svg xmlns="http://www.w3.org/2000/svg" class="w-5" viewBox="0 0 512 512"><path d="M451 374c-15.88-16-54.34-39.35-73-48.76-24.3-12.24-26.3-13.24-45.4.95-12.74 9.47-21.21 17.93-36.12 14.75s-47.31-21.11-75.68-49.39-47.34-61.62-50.53-76.48 5.41-23.23 14.79-36c13.22-18 12.22-21 .92-45.3-8.81-18.9-32.84-57-48.9-72.8C119.9 44 119.9 47 108.83 51.6A160.15 160.15 0 0083 65.37C67 76 58.12 84.83 51.91 98.1s-9 44.38 23.07 102.64 54.57 88.05 101.14 134.49S258.5 406.64 310.85 436c64.76 36.27 89.6 29.2 102.91 23s22.18-15 32.83-31a159.09 159.09 0 0013.8-25.8C465 391.17 468 391.17 451 374z" fill="green" stroke="currentColor"/></svg></button>` : `<button id="btn-offline-${friendList[i].userID}" class="w-1/3 p-1  pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" class=" p-1 w-5 fill-red-800" viewBox="0 0 512 512"><circle cx="256" cy="256" r="192" /></svg></button>`}
</div>
        `
    friendsDropMenu.innerHTML += friendElem
  }

  friendList.map(e => {
    const callBtn = document.getElementById(`btn-call-${e.userID}`)
    if (callBtn !== null) {
      callBtn.addEventListener('click', (ev) => {
        console.log('CLIEKCED')
        socket.emit('requestCall', { friend: e, sender })
      })
    }
    return e
  })
}

export async function fetchAndRenderFriends () {
  try {
    // Fetch both Mongo and Redis friends concurrently
    const friendsDropMenu = document.getElementById('dropdown-menu')
    friendsDropMenu.innerHTML = `
<div role="status" class="grid justify-items-center self-center">
    <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span class="sr-only">Loading...</span>
</div>`

    friendsDropMenu.className = 'px-4 w-full'
    let mySocket = new Promise((resolve) => {
      socket.on('my-connection', (mySckt) => {
        mySocket = mySckt
        resolve(mySocket)
      })
    })

    const [mongoFriendsRes, redisFriendsRes] = await Promise.all([
      fetch('/get-mongo/friends'),
      fetch('/get-redis/friends')
    ])

    // Wait for JSON data from both responses
    const [mongoFriends, redisFriends] = await Promise.all([
      mongoFriendsRes.json(),
      redisFriendsRes.json()
    ])

    // Initialize friendList and combine data
    const friendList = [...mongoFriends.MongoFriends, ...redisFriends.RedisFriends]

    // Now, render the friends after everything has been fetched and processed
    renderFriends(friendList, mySocket)
    return friendList
  } catch (error) {
    console.error('Error fetching friends:', error)
  }
}

// Call the async function to start fetching and rendering friends

const init = async () => {
  const friendList = await fetchAndRenderFriends()
  socket.on('new-connection', (data) => {
    const { sender } = data
    const updatedList = friendList.map(e => {
      if (e.userID === sender.user.userID) {
        e.status = sender.user.status
      }
      return e
    })
    setTimeout(() => {
      renderFriends(updatedList, data.receptor)
    }, 2000)
  })

  socket.on('disconnection', (data) => {
    const updatedList = friendList.map(e => {
      if (e.userID === data.sender.userID) {
        e.status = data.sender.status
        return e
      }
      return e
    })
    setTimeout(() => {
      renderFriends(updatedList, data.receptor)
    }, 2000)
  })

  // Escuchar el evento 'newRoom' desde el servidor para redireccionar
  socket.on('newRoom', async (data) => {
    const { _id } = data
    window.location.replace(`/channel/${_id}`)
  })

  socket.on('update-friends', async (data, isDel = false) => {
    console.log(data, isDel)
    if (data.user && isDel === false) {
      const { user } = data
      user.socket = data.socket
      friendList.push(user)
      renderFriends(friendList, user)
    } else if (!data.user && isDel === false) {
      friendList.push(data)
      renderFriends(friendList, data)
    } else if (isDel) {
      const fList = await fetchAndRenderFriends()
      fList.forEach(e => {
        if (e.userID === data.userID) fList.splice(fList.indexOf(e), 1)
      })
    }
  })
  socket.on('tokenChecker', () => window.location.replace('/auth/github'))
  return friendList
}
document.addEventListener('DOMContentLoaded', async function () {
  const friends = init()
  window.friends = friends
})

window.socket = socket
