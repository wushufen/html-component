import { removeNode } from './utils/dom.js'
// eslint-disable-next-line no-unused-vars
import { parseHTML } from './utils/parse.js'
// eslint-disable-next-line no-unused-vars
import { compile, queryNode } from './compile.js'

class Component {
  static compiledTpl = `
    <h1><text id_="1">Hello \${date.toLocaleString()}</text></h1>
  `

  container = null
  nodeMap = {}
  constructor() {
    // init dom
    this.container = parseHTML(this.constructor.compiledTpl)
  }
  render() {
    var self = this

    // <script>
    var date = new Date()
    setInterval(function () {
      self.$render()
      /* --inject render-- */

      date = new Date()
    }, 1000)
    // </script>

    this.render = function ($props) {
      self.text('1', `Hello ${date.toLocaleString()}`)
    }
    this.render()
  }
  $render() {
    Promise.resolve().then(this.render.bind(this))
  }
  $(id, isText) {
    return (
      this.nodeMap[id] ||
      (this.nodeMap[id] = queryNode(this.container, id, isText))
    )
  }
  exp(...args) {
    const value = args.pop()
    if (value === undefined) return ''

    if (value?.constructor === Object || value instanceof Array) {
      try {
        return `\n${JSON.stringify(value, null, '  ')}\n`
      } catch (_) {
        return value
      }
    }

    return value
  }
  text(id, value) {
    const node = this.$(id, true)
    if (node.nodeValue !== value) {
      node.nodeValue = value
    }
  }
  attr(id, name, calc) {
    const node = this.$(id)
    const value = calc.call(node)
    node.setAttribute(name, value)
  }
  prop(id, name, calc) {
    const node = this.$(id)
    const value = calc.call(node)
    node[name] = value
  }
  on(id, name, handler) {
    this.prop(id, name, function () {
      return handler
    })
  }
  for(id, list, cb) {
    const node = this.$(id)
    // TODO
  }
  if(id, bool, cb) {
    const node = this.$(id)

    // TODO
    if (bool) {
      cb()
    } else {
      removeNode(node)
    }
  }
  is(id, Class) {
    const node = this.$(id)

    // TODO
    node.innerHTML = `TODO: is ${Class.name}`
  }
  setTimeout() {}
  setInterval() {}
  destory() {}
}

export default Component
export { Component }
