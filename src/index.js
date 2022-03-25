import Component from './Component.js'
import { compile, getNodeMap } from './compile.js'

/**
 * index.html
 */
function initIndex() {
  if (initIndex.done) return
  initIndex.done = true

  const node = document.documentElement
  const { scriptCode, code } = compile(node)

  class Index extends Component {
    constructor() {
      super()
      this.nodeMap = getNodeMap(node)
    }
    create() {
      this.render = Function(`
        var self = this

        ${code}
      `)
    }
  }

  const app = new Index()
  node['#//component'] = app
  app.render()

  // TODO
  if (/\b(setTimeout|setInterval|then)\b/.test(scriptCode)) {
    setInterval(() => {
      app.render()
    }, 250)
  }
  if (/\b(requestAnimationFrame)\b/.test(scriptCode)) {
    !(function loop() {
      requestAnimationFrame(function () {
        app.render()
        loop()
      })
    })()
  }
  if (/\b(location)\b/.test(scriptCode)) {
    addEventListener('hashchange', function () {
      app.render()
    })
    addEventListener('popstate', function () {
      app.render()
    })
  }
}
if (document.readyState === 'complete') {
  initIndex()
} else {
  addEventListener('DOMContentLoaded', initIndex)
  addEventListener('load', initIndex)
}
