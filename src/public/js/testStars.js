let H
let W
window.onload = () => {
  // Background "stars"

  const cnv = document.getElementById('canvas')

  const ctx = cnv.getContext('2d')
  H = window.innerHeight
  W = window.innerWidth
  // Bg
  cnv.width = W
  cnv.height = H
  ctx.fillStyle = 'transparent'
  ctx.fillRect(0, 0, W, H)
  ctx.fillRect(10, 10, 1, 1)

  // Glow effect
  ctx.shadowBlur = 10
  ctx.shadowColor = 'withe'

  let counter = 0

  function animate () {
    counter += 1
    // Random position and size of stars;
    const x = W * Math.random()
    const y = H * Math.random()
    const r = 2.5 * Math.random()

    // Draw the stars;
    ctx.beginPath()
    ctx.fillStyle = 'white'
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()

    if (counter === 200) {
      return
    }
    setTimeout(animate, 100)
  }
  animate()
}
