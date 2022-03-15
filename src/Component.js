import { hasOwnProperty, each } from './utils.js'
import {
  insert,
  remove,
  replace,
  parseHTML,
  createFragment,
  createComment,
} from './dom.js'
import { compile, NodeMap, cloneWithId } from './compile.js'

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
      this.fragment = createFragment(this.constructor.compiledTpl)
      this.nodeMap = NodeMap(this.fragment)
      this.childNodes = [...this.fragment.childNodes]
    } else {
      let node = tpl
      const isStringTpl = typeof tpl === 'string'
      if (isStringTpl) {
        node = parseHTML(tpl)
      }

      const { scriptCode, code } = compile(node)
      this.fragment = isStringTpl ? createFragment(node.childNodes) : node
      this.nodeMap = NodeMap(node)
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
    if (id.nodeType) node = id // dev

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
    if (node.nodeValue === value) return
    node.nodeValue = value
  }
  attr(id, name, value) {
    const node = this.$(id)
    const attrs = node['#attrs'] || (node['#attrs'] = {})
    if (value instanceof Function) value = value.call(node)

    if (attrs[name] === value && hasOwnProperty.call(attrs, name)) return
    attrs[name] = value

    if (/^(false|null|undefined)$/.test(value)) {
      node.removeAttribute(name)
      return
    }

    node.setAttribute(name, value)
  }
  prop(id, name, value) {
    const node = this.$(id)
    const props = node['#props'] || (node['#props'] = {})
    if (value instanceof Function) value = value.call(node)

    // ...="{}" => prop(ID, '..', {})
    if (name == '..') {
      for (const k in value) this.prop(id, k, value[k])
      return
    }

    if (props[name] === value && hasOwnProperty.call(props, name)) return
    props[name] = value

    // propSetters
    if (Component.propSetters[name]) {
      Component.propSetters[name].call(node, value)
      return
    }

    // activeElement
    if (value === node[name]) return

    node[name] = value
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
    let comment = node['#for<comment>']

    if (!comment) {
      comment = createComment('for', Component.debug)
      node['#for<comment>'] = comment
      comment['#//for<node>'] = node
      replace(node, comment)
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
      insert(cloneNode, comment)

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
    let comment = node['#if<comment>']

    if (!!bool !== !!lastBool) {
      node['#if(bool)'] = bool
      if (bool) {
        replace(comment, node)
      } else {
        if (!comment) {
          comment = createComment('if', Component.debug)
          node['#if<comment>'] = comment
          comment['#//if.node'] = node
        }
        replace(node, comment)
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

/**
 * @example
 * Component.propSetters.show = function set(bool) {
 *   this.style.display = bool ? '' : 'none'
 * }
 * ==
 * Object.defineProperties(Element.prototype, {
 *   show: {
 *     set(bool) {
 *       this.style.display = bool ? '' : 'none'
 *     },
 *   },
 * })
 */
Component.propSetters = {
  /**
   * <el .class="{}" >
   * @param {Object} classes
   * @this {Element}
   */
  class(classes) {
    for (const name in classes) {
      const bool = classes[name]
      if (bool) {
        this.classList.add(name)
      } else {
        this.classList.remove(name)
      }
    }
  },
  /**
   * <el .style="{}" >
   * @param {Object} styles
   * @this {Element}
   */
  style(styles) {
    for (const name in styles) {
      const value = styles[name]
      if (typeof value === 'number') {
        this.style[name] = value
        // auto+px
        if (Number(this.style[name]) !== value) {
          this.style[name] = value + 'px'
        }
      } else {
        this.style[name] = value
      }
    }
  },
}

class HelloWorld extends Component {
  static compiledTpl = `
    <h1><t id="1#">Hello \${text}</t></h1>
  `
  render() {
    const self = this
    const text = 'world'
    self.render = function () {
      self.text('1', `Hello ${text}`)
    }
    self.render()
  }
}

class Time extends Component {
  static compiledTpl = `
    <strong><slot /></strong>
    <text id="1#">Time: \${date.toJSON()}</text>
  `
  render() {
    var self = this

    // <script>
    let date = new Date()
    setInterval(function () {
      self.$render() // injected
      date = new Date()
    }, 10)
    // </script>

    // compiledCode
    self.render = function () {
      self.text('1', `Time: ${date.toJSON()}`)
    }
    self.render()
  }
}

export default Component
export { Component, HelloWorld, Time }
