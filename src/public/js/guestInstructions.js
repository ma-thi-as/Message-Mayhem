const getCustomInstructions = (connectedUser) => {
  const agent = navigator.userAgent
  const brNameList = [' Chrome', ' Firefox', 'Others']
  const otherBrowsers = []
  let browserName
  brNameList.forEach(client => {
    if (agent.indexOf(client) === -1) otherBrowsers.push(client)
    else {
      const agentName = agent.substring(agent.indexOf(client))
      browserName = agentName.substring(0, agentName.indexOf('/'))
    }
  })
  if (!connectedUser.isAnon) {
    return `<h1 class="text-xl font-bold mt-4">Guest login instructions</h1>
   <p class=""> For make a success login, u need<span><b> open a new ${browserName === brNameList[1] ? 'private' : 'incognito'} tab of your current ${browserName}</b><span> ,or You can run directly<span><b> ${otherBrowsers}</b> <i> u any other web browser</i> </span>. (It's requireried brecause for the correct functionally of the loign of yout guest account)</p>`
  }
}

const showInformation = (ev) => {
  console.log('toniblaze')
  const modal = document.getElementById('static-modal')
  modal.classList.remove('hidden')
  console.log()
  const currentLoggedUser = document.querySelector('script[data-current]').getAttribute('data-current')
  const connectedUser = JSON.parse(currentLoggedUser)
  if (connectedUser.isGuest === true) button.className = 'hidden'

  const modalHeader = document.getElementById('modal-header')
  const modalBody = document.getElementById('modal-body')
  const btnAccept = document.getElementById('button-accept')

  if (connectedUser.isAnon === true)btnAccept.className = 'hidden'
  const p = document.createElement('p')
  const br = document.createElement('br')
  const password = document.createElement('p')

  modalHeader.innerText = `${String(connectedUser.username).toUpperCase()} account's information`
  p.innerText = 'Here u can see additional information relationated with u current session and for make a successfull login with your guest account. If Applicable'
  password.innerHTML = `</br>
    <b class="ml-4">- GUEST ID:</b> <span id="userid-span"><i>${connectedUser.userID} ${connectedUser.isGuest ? '+01' : ''}</i></span><br>
    <b class="ml-4">- GUEST USERNAME:</b> <span id="username-span"> <i>${connectedUser.username} ${connectedUser.isGuest ? 'guest' : ''}</i></span><br>
    <b class="ml-4 ${connectedUser.isAnon ? 'hidden' : 'block'}">- TEMPORAL PASSWORD:</b> <span id="password-span"></span>`
  btnAccept.innerText = 'generate password'
  modalBody.appendChild(p)
  modalBody.appendChild(br)
  modalBody.innerHTML += getCustomInstructions(connectedUser)
  modalBody.appendChild(password)
  modalHeader.className += 'text-white'
  const passwordSpan = document.getElementById('password-span')
  const userIdG = document.getElementById('userid-span')
  const usernameG = document.getElementById('username-span')
  passwordSpan.className = 'relative w-16 px-4 text-white text-md p-4'
  userIdG.className = 'relative w-16 px-4 text-white text-md'
  usernameG.className = 'relative w-16 px-4 text-white text-md'
  modalHeader.className += 'text-white'
  const data = window.sessionStorage.getItem('temporal-password')
  if (data === null) passwordSpan.className = 'hidden'
  else passwordSpan.innerHTML = `<i>${data}</i>`

  btnAccept.onclick = async (event) => {
    const req = await fetch('/guest/init/')
    const res = await req.json()
    const { generatedPass } = res
    window.sessionStorage.setItem('temporal-password', generatedPass)
    passwordSpan.classList.remove('hidden')
    passwordSpan.innerHTML = `<i>${generatedPass}</i>`
  }
}

const button = document.getElementById('user-info')
console.log(button)
button.addEventListener('click', () => {
  showInformation()
})
