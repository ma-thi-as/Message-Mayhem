/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')
const defaultTheme = require('tailwindcss/defaultTheme')
const generateColorRangeSafelist = (colors) => {
  const colorNames = Object.keys(colors)
  const ranges = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  colorNames.flatMap(color =>
    ranges.map(range => `text-${color}-${range}`)

  )
  colorNames.flatMap(color =>
    ranges.map(range => `text-${color}-${range}`)

  )

  colorNames.flatMap(color =>
    ranges.map(range => `fill-${color}-${range}`)

  )

  colorNames.flatMap(color =>
    ranges.map(range => `group-hover:text-${color}-${range}`)
  )

  colorNames.flatMap(color =>
    ranges.map(range => `hover:bg-${color}-${range}`)
  )

  colorNames.flatMap(color =>
    ranges.map(range => `group-hover:fill-${color}-${range}`)
  )

  return colorNames.flatMap(color =>
    ranges.map(range => `text-${color}-${range}`)
  )
}

module.exports = {
  content: ['./src/views/**/*.{html,js,ejs}', './src/views/*.{html,js,ejs}', './src/public/js/*.{html,js,ejs}'],
  safelist: [
    ...generateColorRangeSafelist(colors),
    { pattern: /^w-/ },
    { pattern: /^fill-/ },
    { pattern: /^cursor-/ },
    { pattern: /^ring-/ },
    { pattern: /^bg-/ },
    { pattern: /^flex-/ },
    { pattern: /^text-/ },
    { pattern: /^justify-/ },
    { pattern: /^max-/ },
    { pattern: /^left-/ },
    { pattern: /^top-/ },
    { pattern: /^right-/ },
    { pattern: /^bottom-/ },
    { pattern: /^min-/ },
    { pattern: /^flex-/ },
    { pattern: /^space-x-/ },
    { pattern: /^space-y-/ },
    { pattern: /^inset-x-/ },
    { pattern: /^justify-self-/ },
    { pattern: /^inset-y-/ },
    { pattern: /^rounded-/ },
    { pattern: /^px-/ },
    { pattern: /^py-/ },
    { pattern: /^text-/ },
    { pattern: /^m-/ },
    { pattern: /^animate-/ },
    { pattern: /^h-/ },
    { pattern: /^gap-/ },
    { pattern: /^shadow-/ },
    { pattern: /^bg-gradient-/ }
  ],
  theme: {
    screens: {
      ...defaultTheme.screens
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      red: colors.red,
      black: colors.black,
      white: colors.white,
      emerald: colors.emerald,
      indigo: colors.indigo,
      gray: colors.gray,
      blue: colors.blue,
      sky: colors.sky,
      green: colors.emerald,
      purple: colors.violet,
      yellow: colors.amber,
      pink: colors.fuchsia,
      blueDark: '#111122'
    },
    extend: {
      screens: {
        sm: '640px',
        // => @media (min-width: 640px) { ... }

        md: '768px',
        // => @media (min-width: 768px) { ... }

        lg: '1024px',
        // => @media (min-width: 1024px) { ... }

        xl: '1280px',
        // => @media (min-width: 1280px) { ... }

        '2xl': '1536px'
      // => @media (min-width: 1536px) { ... }
      },
      display: ['hover', 'focus', 'group-hover', 'responsive']

    }
  },
  plugins: [
  ]
}
