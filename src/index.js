import Component from './Component.js'
import { compile, getNodeMap } from './compile.js'
import { deepClone, deepSame } from './utils.js'

/**
 * index.html
 */
function initIndex() {
  if (initIndex.done) return
  initIndex.done = true

  const node = document.documentElement
  const { code, vars } = compile(node)

  class Index extends Component {
    varGetters = {}
    dirtyCheckDelay = 10
    dirtyCheckDelayMax = 1000
    constructor() {
      super()
      this.nodeMap = getNodeMap(node)
    }
    create() {
      this.render = Function(`
        console.timeEnd()
        console.time()
        var self = this

        ${code}

        this.updateData()
      `)
    }
    getVar(name) {
      const varGetters = this.varGetters

      if (varGetters[name]) {
        return varGetters[name]()
      } else {
        const getter = Function(`return ${name}`) // let !window[name]
        try {
          varGetters[name] = getter
          return getter()
        } catch (_) {
          varGetters[name] = function () {}
        }
      }
    }
    updateData() {
      const data = {}
      vars.forEach((varName) => {
        data[varName] = this.getVar(varName)
      })
      this.data = deepClone(data)
      return data
    }
    dirtyCheck() {
      const oldData = this.data
      const newData = this.updateData()
      const isSame = deepSame(newData, oldData)

      let delay = this.dirtyCheckDelay
      const delayMax = this.dirtyCheckDelayMax
      if (isSame) {
        delay += 25
        delay = Math.max(100, delay)
      } else {
        app.render()
        delay /= 5
      }
      delay = Math.max(1, Math.min(delayMax, delay))
      this.dirtyCheckDelay = delay

      if (delay <= 10) {
        requestAnimationFrame(() => {
          this.dirtyCheck()
        })
      } else {
        setTimeout(() => {
          this.dirtyCheck()
        }, delay)
      }
    }
  }

  const app = new Index()
  node['#//component'] = app
  app.render()
  setTimeout(() => {
    app.dirtyCheck()
  }, app.dirtyCheckDelay)
}
if (document.readyState === 'complete') {
  initIndex()
} else {
  addEventListener('DOMContentLoaded', initIndex)
  addEventListener('load', initIndex)
}

addEventListener(
  'load',
  function (e) {
    e.props = { yes: true }
  },
  true
)
