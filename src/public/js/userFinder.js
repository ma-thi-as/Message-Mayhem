const socket = window.socket

const buttonsHelper = (userMatch, modal) => {
  userMatch.map(e => {
    const addFriends = document.getElementById(`add-friend-${e.userID}`)
    const delFriends = document.getElementById(`del-friend-${e.userID}`)

    addFriends.onclick = async (ev) => {
      ev.preventDefault()
      const request = await fetch('/add/friend', {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ userID: e.userID, username: e.username })
      })
      if (request.status === 200) {
        addFriends.setAttribute('disabled', true)
        modal.classList.add('hidden')
        socket.emit('update-friends', e, false)
      }
    }

    delFriends.onclick = async (ev) => {
      ev.preventDefault()
      const confirmation = window.confirm(`Are you sure of delete ${e.username}`)
      if (confirmation) {
        const request = await fetch('/del/friend', {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ userID: e.userID, isAnon: e.isAnon !== undefined ? e.isAnon : false })
        })
        if (request.status === 200) {
          delFriends.setAttribute('disabled', true)

          modal.classList.add('hidden')
          socket.emit('update-friends', e, true)
        }
      }
    }
    return e
  })
}
const renderSearch = (userMatch, friendsList) => {
  const friendsIds = friendsList.map(e => e.userID)
  const modalHeader = document.getElementById('modal-header')
  const modalBody = document.getElementById('modal-body')
  if (userMatch.length === 0) {
    const acpBtn = document.getElementById('button-accept')
    acpBtn.className = 'hidden'
    modalHeader.innerText = 'Not Found'
    modalBody.className = 'hidden'
  } else {
    modalHeader.innerText = "User's match"
    modalBody.innerHTML = ''
    userMatch.map(async (e) => {
      modalBody.innerHTML += `<ol class="w-full flex items-center justify-center">
    <li class="flex justify-between items-center bg-custom3 m-auto rounded-lg shadow-lg p-2 w-full max-w-xs">
        <!-- Username on the left -->
        <p class="text-left">${e.username}</p>
        
        <div class="flex items-center">
            <!-- Add Friend Button -->
            <button id="add-friend-${e.userID}" class="flex items-center justify-center text-gray-400 rounded-lg ml-3 p-2 hover:bg-green-600 hover:text-gray-900 transition duration-300 ${friendsIds.includes(String(e.userID)) ? 'hidden' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-6" viewBox="0 0 512 512">
                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 112v288M400 256H112"/>
                </svg>

            </button>

            <!-- Remove Friend Button -->
            <button id="del-friend-${e.userID}" class="flex items-center justify-center ml-4 p-2 rounded-lg hover:bg-red-800 transition duration-300 ${friendsIds.includes(String(e.userID)) ? '' : 'hidden'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-6 stroke-red-500" viewBox="0 0 512 512">
                    <path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" fill="none" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                    <path stroke="red" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352"/>
                    <path d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" fill="none" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>

            </button>
        </div>
    </li>
</ol>`

      return e
    })

    modalBody.classList.remove('justify-between')
    modalBody.classList.add('justify-center')
  }
}

const userFinder = async () => {
  const friendsList = await window.friends
  const input = document.getElementById('user-searcher')
  const currentLoggedUser = document.querySelector('script[data-current]').getAttribute('data-current')
  const connectedUser = JSON.parse(currentLoggedUser)
  console.log(connectedUser)
  if (friendsList) input.readOnly = false

  const form = document.getElementById('search')

  // Helper function to delay execution
  const timeSetterHelper = (callback) => {
    console.log('STARTING')
    return setTimeout(callback, 4000) // Delay for 4 seconds
  }

  // Add event listener to form submit
  form.addEventListener('submit', (event) => {
    event.preventDefault() // Prevent default form submission immediately

    // Delay the execution of the main logic
    timeSetterHelper(async () => {
      const modal = document.getElementById('static-modal')
      const modalBtnContainer = modal.querySelector('#btns-container') // Scoped within the modal
      const btnAccept = modal.querySelector('#button-accept') // Scoped within the modal
      const value = input.value

      // Fetch the matches
      const fetchingMatches = await fetch(`/get/friend/${value}`)
      const matchesResponse = await fetchingMatches.json()

      const { userMatch } = matchesResponse
      for (let index = 0; index < userMatch.length; index++) {
        const element = userMatch[index]
        if (element.userID === connectedUser.userID) {
          userMatch.splice(element, 1)
        }
      }
      // Show modal and modify button styles (scoped to this modal)
      modal.classList.remove('hidden')
      btnAccept.classList.add('hidden') // Use .classList for safer modification
      modalBtnContainer.classList.add('justify-items-center')

      // Render user search results
      renderSearch(userMatch, friendsList)
      buttonsHelper(userMatch, modal)
    })
  })
}

document.addEventListener('DOMContentLoaded', function () {
  userFinder()
})
