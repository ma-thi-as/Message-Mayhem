const generateRandomChangers = (strLength, min = 2, max = 6) => {
  const randomNumber = Math.random().toString().at(2)
  const minRandomNumber = randomNumber > min ? randomNumber : randomNumber + min
  const randomRangeCToChange = Math.floor(minRandomNumber * Math.floor(strLength * 0.2))
  console.log(Math.floor(strLength * 0.4), minRandomNumber)
  return randomRangeCToChange
}
const generatePassword = (strLength = 16) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '1234567890'
  let password = ''
  const modifiedPositions = new Set()

  // Generate basic string
  for (let i = 0; password.length < strLength; i++) {
    let newChar
    do {
      newChar = alphabet[Math.floor(Math.random() * strLength)]
    } while (newChar === password[password.length - 1])
    password += newChar
  }

  // Change lower to upper at random positions
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * strLength)
    modifiedPositions.add(randomIndex)
    password = password.substring(0, randomIndex) + password[randomIndex].toUpperCase() + password.substring(randomIndex + 1)
  }

  // Change lower to number at random positions
  for (let i = 0; i < 6; i++) {
    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * strLength)
    } while (modifiedPositions.has(randomIndex))
    modifiedPositions.add(randomIndex)
    password = password.substring(0, randomIndex) + numbers[Math.floor(Math.random() * numbers.length)] + password.substring(randomIndex + 1)
  }

  return password
}

module.exports = generatePassword
