import { each } from './utils/index.js'
import { insert, remove, replace, createPlace } from './utils/dom.js'
import {
  parseHTML,
  parseFragment,
  childNodesToFragment,
} from './utils/parse.js'
import { compile, parseId, cloneWithId } from './compile.js'

class Component {
  static debug = !false
  static compiledTpl = ``
  render() {}
  $render() {
    Promise.resolve().then(this.render.bind(this))
  }

  fragment = null
  childNodes = null
  nodeMap = null
  forKey = ''
  constructor(tpl) {
    if (!tpl) {
      // init dom
      this.fragment = parseFragment(this.constructor.compiledTpl)
      this.nodeMap = parseId(this.fragment)
      this.childNodes = [...this.fragment.childNodes]
    } else {
      let node = tpl
      const isStringTpl = typeof tpl === 'string'
      if (isStringTpl) {
        node = parseHTML(tpl)
      }

      const { scriptCode, code } = compile(node)
      this.fragment = isStringTpl ? childNodesToFragment(node) : node
      this.nodeMap = parseId(node)
      this.childNodes = isStringTpl ? [this.fragment] : [node]

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
    let node = this.nodeMap[id]
    if (this.forKey) {
      node = node[`#<clone>${id}${this.forKey}`]
    }

    if (!node['#//nodeValue']) {
      node['#//nodeValue'] = node.nodeValue || node.cloneNode().outerHTML
    }
    return node
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
    if (node.getAttribute(name) !== value) {
      node.setAttribute(name, value)
    }
  }
  prop(id, name, calc) {
    const node = this.$(id)
    const value = calc.call(node)
    if (node[name] !== value) {
      node[name] = value
    }
  }
  on(id, name, handler) {
    this.prop(id, name, function () {
      return handler
    })
  }
  /**
   * <div for="(item,key) in list">
   *   <a .title="item" />
   *   <span for="(c,k) in item">
   *     <b .title="c" />
   *   </span>
   * </div>
   *
   * self.for(1, list, function(item, key){  // 1
   *   self.prop(2, 'title', item)           // 2.[key]
   *   self.for(3, item, function(c, k){     // 3.[key]
   *     self.prop(4, 'title', c)            // 4.[key].[k]
   *   })
   * })
   */
  for(id, list, cb) {
    // const origin = this.nodeMap[id]
    const node = this.$(id)
    const cloneNodes = node['#cloneNodes'] || (node['#cloneNodes'] = {})
    let place = node['#for<place>']

    if (!place) {
      place = createPlace('for', Component.debug)
      node['#for<place>'] = place
      place['#//for<node>'] = node
      replace(node, place)
    }

    const forKey = this.forKey
    // ++
    each(list, (item, key, index) => {
      this.forKey = `${forKey}.${key}` // *** for + for => id.for1key.for2key
      let cloneNode = cloneNodes['key:' + key]

      // clone
      if (!cloneNode) {
        cloneNode = cloneWithId(node, this.forKey)
        cloneNodes['key:' + key] = cloneNode
        cloneNode['#key'] = key
        cloneNode['#for<node>'] = node
      }
      cloneNode['#noRemove'] = true
      insert(cloneNode, place)

      // >>>
      cb.call(this, item, key, index)
    })
    this.forKey = forKey

    // --
    each(cloneNodes, (cloneNode) => {
      if (!cloneNode['#noRemove']) {
        remove(cloneNode)
        // !delete: reuse
        // delete cloneNodes['key:' + cloneNode['#key']] // todo: for+for length--
        // delete origin[`#<clone>${cloneNode['#id']}`]
      } else {
        delete cloneNode['#noRemove']
      }
    })
  }
  if(id, bool, cb) {
    const node = this.$(id)
    const lastBool = '#if(bool)' in node ? node['#if(bool)'] : true
    let place = node['#if<place>']

    if (!!bool !== !!lastBool) {
      node['#if(bool)'] = bool
      if (bool) {
        replace(place, node)
      } else {
        if (!place) {
          place = createPlace('if', Component.debug)
          node['#if<place>'] = place
          place['#//if.node'] = node
        }
        replace(node, place)
      }
    }

    if (bool) {
      cb.call(this)
    }

    return {
      elseif: (id, bool_, cb) => {
        if (!bool && bool_) {
          this.if(id, true)
          cb.call(this)
          bool = true
        } else {
          this.if(id, false)
        }
        return this
      },
      else: (id, cb) => {
        if (bool) {
          this.if(id, false)
        } else {
          this.if(id, true)
          cb.call(this)
        }
      },
    }
  }
  new(id, Class) {
    const node = this.$(id)

    if (Class?.then) {
      Class.then((Class) => render(node, Class))
    } else {
      render(node, Class)
    }

    /**
     *
     * @param {Element} node
     * @param {function} Class
     */
    function render(node, Class) {
      if (Class === Component || Class?.prototype instanceof Component) {
        let component = node['#component']
        // new
        if (!component) {
          component = new Class()
          node['#component'] = component
          // replace(node, component.fragment)

          const shadow = node.attachShadow({ mode: 'open' })
          shadow.appendChild(component.fragment)
        }
        // render
        // TODO props && diff
        component.render()
      }
    }
  }
  destory() {
    console.debug('destory', this)
  }
}

class HelloWorld extends Component {
  static compiledTpl = `
    <h1><text id="1#">Hello \${text}</text></h1>
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

class Time extends Component {
  static compiledTpl = `
    <text id="1#">Time: \${date.toLocaleString()}</text>
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

    // compiledCode
    self.render = function () {
      self.text('1#', `Time: ${date.toLocaleString()}`)
    }
    self.render()
  }
}

export default Component
export { Component, HelloWorld, Time }
