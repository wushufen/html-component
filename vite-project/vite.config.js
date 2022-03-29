import htmlLoader from './vite.plugin.js'

export default {
  build: {
    target: 'es2015',
  },
  plugins: [htmlLoader()],
}
