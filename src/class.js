import { insertNode, removeNode } from './utils/dom.js'
import {
  parseHTML,
  parseFragment,
  childNodesToFragment,
} from './utils/parse.js'
import { compile, getNodeMap } from './compile.js'

class Component {
  static compiledTpl = `
    <txt id_="1#">\${date.toLocaleString()}</txt>
  `
  render() {
    var self = this

    // <script>
    let date = new Date()
    setInterval(function () {
      self.$render() // injected
      date = new Date()
    }, 1000)
    // </script>

    self.render = function () {
      self.text('1#', `${date.toLocaleString()}`)
    }
    self.render()
  }
  $render() {
    Promise.resolve().then(this.render.bind(this))
  }

  fragment = null
  nodeMap = null
  forKey = ''
  constructor(tpl) {
    if (!tpl) {
      // init dom
      this.fragment = parseFragment(this.constructor.compiledTpl)
      this.nodeMap = getNodeMap(this.fragment)
    } else {
      let node = tpl
      const isStringTpl = typeof tpl === 'string'
      if (isStringTpl) {
        node = parseHTML(tpl)
      }

      const { scriptCode, code } = compile(node)
      this.fragment = isStringTpl ? childNodesToFragment(node) : node
      this.nodeMap = getNodeMap(node)

      this.render = Function(`
        var self = this

        ${isStringTpl ? scriptCode : `// <script>...</script>`}

        this.render = function(){
          ${code}
        }
        this.render()
      `)
    }
    this.render()
  }
  $(id) {
    return this.nodeMap[id]
  }
  exp(...values) {
    const value = values.pop()
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
    const node = this.$(id)
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
    let target = node['#if#']

    if (bool) {
      insertNode(node, target)
      cb.call(this)
    } else {
      if (!target) {
        target = document.createComment('if: ' + node.cloneNode().outerHTML)
        node['#if#'] = target
        insertNode(target, node)
      }
      removeNode(node)
    }

    var self = this
    return {
      elseif: function (id, bool2, cb) {
        if (!bool && bool2) {
          self.if(id, true)
          cb.call(self)
          bool = true
        } else {
          self.if(id, false)
        }
        return this
      },
      else: function (id, cb) {
        if (bool) {
          self.if(id, false)
        } else {
          self.if(id, true)
          cb.call(self)
        }
      },
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

class HelloWorld extends Component {
  static compiledTpl = `
  <h1><txt id_="1#">Hello \${text}</txt></h1>
  `
  render() {
    const self = this

    const text = 'world'

    self.render = function () {
      self.text('1#', `Hello ${text}`)
    }
    self.render()
  }
}

export default Component
export { Component, HelloWorld }
