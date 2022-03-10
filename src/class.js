import { removeNode } from './utils/dom.js'
import { parseHTML } from './utils/parse.js'
import { compile, queryNode } from "./compile.js";

const helloTpl = `
    <div><t_ _="1">Hello \${text}</t_></div>
`

class Component {
  tpl = helloTpl
  wrapper = null
  nodeMap = {}

  constructor(tpl) {
    if (tpl) {
      const isNodeTpl = !!tpl.nodeType
      const {wrapper, code, scriptCode} = compile(tpl)
      this.wrapper = wrapper

      this.render = Function(`
        var self = this
      
        ${isNodeTpl? '' : scriptCode}

        this.render = function($props){
          ${code}
        }

        this.render()
      `)
    }
  }
  $(id) {
    let node = this.nodeMap[id]
    if (!node) {
      node = queryNode(this.wrapper, id)
      this.nodeMap[id] = node
    }
    return node
  }
  exp(...args) {
    return args.pop()
  }
  text(id, value) {
    const node = this.$(id)
    if (node.nodeValue !== value) {
      node.nodeValue = value
    }
  }
  attr(id, name, value) {
    const node = this.$(id)
    node.setAttribute(name, value)
  }
  prop(id, name, calc) {
    const node = this.$(id)
    const value = calc.call(this)
    node[name] = value
  }
  on(id, name, handler) {
    this.prop(id, name, function(){
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
  render() {
    const self = this

    var text = 'world'

    this.render = function ($props) {
      self.text(1, `Hello ${self.exp(text)}`)
    }

    this.render()
  }
  destory() {}
}

export default Component
export {
  Component
}