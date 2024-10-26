const socket = io('/guest')
const form = document.getElementById('login-form')
const renderError = (form, msgList) => {
  window.alert(msgList.join('\n'))
  form.reset()
}
socket.on('tokenCheckFailed', (e) => {
  renderError(form, [e.message])
})

const handleAnonSessionStorage = (data) => {
  data = JSON.stringify(data)
  sessionStorage.setItem('anon', data)
  const newSession = sessionStorage.getItem('anon')
  return JSON.parse(newSession)
}
const fetchingNewAnonUser = async () => {
  sessionStorage.removeItem('anon')
  const badInputs = []
  try {
    const newUser = await fetch('/auth/get/anonymous_user')
    const { user, message } = await newUser.json()

    if (!newUser.ok && message) badInputs.push(message)
    if (badInputs.length > 0) return renderError(badInputs)
    const anonSession = handleAnonSessionStorage(user)
    return anonSession
  } catch (e) {
    console.log('errore: ', e)
  }
}
const handleAn = async (event) => {
  event.preventDefault()
  const badInputs = []
  const haveAnonSession = await fetchingNewAnonUser()
  const anonSession = haveAnonSession.message ? renderError(form, [haveAnonSession.message]) : haveAnonSession

  const singIn = await fetch('/auth/anonymous', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userID: anonSession.userID, username: anonSession.username, password: anonSession.password })
  })
  if (!singIn.ok) {
    const response = await singIn.json()
    if (badInputs.length > 0) badInputs.push(response.message)
  } else {
    window.location.href = '/home'
  }
  if (badInputs.length > 0) renderError(form, badInputs)
}

const formHandler = (event) => {
  event.preventDefault()

  const bodyResponse = { username: '', password: '' }
  const badInputs = []
  // Get values from form element
  Object.keys(form).forEach(e => {
    // Filter all required inputs
    if (form[e].tagName !== 'BUTTON') {
      const keyName = form[e].placeholder
      const valueName = form[e].value
      bodyResponse[keyName] = valueName
    }
  })
  // No empty values
  Object.keys(bodyResponse).forEach((e) => {
    if (bodyResponse[e].trim() === '') badInputs.push(`${e} should not be empty`)
  })
  // If errors in badInputs array render it
  if (badInputs.length > 0) return renderError(form, badInputs)
  else {
    // Else make ajax request
    (async () => {
      const checker = await fetch('/guest/auth', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyResponse)
      })

      const response = await checker.json()
      if (checker.status !== 200) {
        if (response.type === 'token') {
          // emit to corresponding client a request for refresh the current token
          badInputs.push('Token exipred, please relogin on yout main account')
          bodyResponse.socket = socket.id
          socket.emit('tokenCheck', bodyResponse)
        } else {
          badInputs.push(response.Message)
        }
      } else if (checker.ok) {
        window.location.href = '/home'
      }
      if (badInputs.length > 0) renderError(form, badInputs)
    })()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  form.addEventListener('submit', formHandler)
})
