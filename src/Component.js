import { hasOwnProperty, each } from './utils.js'
import {
  insert,
  remove,
  replace,
  append,
  parseHTML,
  createComment,
} from './dom.js'
import { compile, getNodeMap, cloneWithId, cloneNodeDeep } from './compile.js'

class Component {
  static debug = !false
  // tpl(id)
  static tpl = `
    <!-- tpl -->
  `
  render() {
    // code
  }
  $render() {
    const self = this
    Promise.resolve().then(function () {
      self.render()
    })
  }

  props = null
  target = null
  childNodes = null
  nodeMap = null
  parentComponent = null
  childComponents = []
  forKey = ''
  constructor({ target, mode } = {}) {
    if (target) {
      const _container = parseHTML(this.constructor.tpl)
      // id => node
      this.nodeMap = getNodeMap(_container)
      this.childNodes = [..._container.childNodes]

      // //debug
      const firstChild =
        _container.firstElementChild || _container.firstChild || ''
      firstChild['#//component'] = this

      // target
      this.target = target
      this.props = target['#props'] || {}

      // insert this.childNodes
      if (mode === 'web') {
        const shadowRoot =
          target.shadowRoot || target.attachShadow({ mode: 'open' })
        shadowRoot.innerHTML = ''
        append(shadowRoot, this.childNodes)
      } else if (mode === 'wrap') {
        append(target, this.childNodes)
      } else {
        replace(target, this.childNodes)
      }

      // first render
      this.render()
    }
  }
  // TODO a. id+forL+item+n => cloneNode
  // TODO b. forKey:  item.id || item._id
  x$(id) {
    if (id.nodeType) return id // debug

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

    // diff?
    if (node.nodeValue === value) return

    node.nodeValue = value
  }
  attr(id, name, value) {
    const node = this.$(id)
    const attrs = node['#attrs'] || (node['#attrs'] = {})
    if (value instanceof Function) value = value.call(node)

    // diff?
    if (attrs[name] === value && hasOwnProperty.call(attrs, name)) return
    attrs[name] = value

    // <div attr="${false}">
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
      for (const k in value)
        this.prop(id, k, function () {
          return value[k]
        })
      return
    }

    // diff?
    if (props[name] === value && hasOwnProperty.call(props, name)) return
    props[name] = value

    // propSetters
    if (Component.propSetters[name]) {
      Component.propSetters[name].call(node, value)
      return
    }

    // activeElement
    if (value === node[name]) return

    try {
      node[name] = value
    } catch (error) {
      console.warn(error)
      // todo
    }
  }
  on(id, name, handler) {
    this.prop(id, name, function () {
      return handler
    })
  }
  /**
   * <div for="(item,key) in list">
   *   <a .title="item"></a>
   *   <span for="(c,k) in item">
   *     <b .title="c"></b>
   *   </span>
   * </div>
   *
   * self.for(1, list, function(item, key){  // 1
   *   self.prop(2, 'title', item)           // 2.[item]
   *   self.for(3, item, function(c, k){     // 3.[item]
   *     self.prop(4, 'title', c)            // 4.[item].[c]
   *   })
   * })
   */
  // TODO a. id+forL+item+n => cloneNode
  // TODO b. forKey:  item.id || item._id
  // TODO cloneNode = node + currentItem + currentItemN?
  $(id) {
    let node = this.nodeMap[id]
    if (this.forKey) {
      node = node[`#<clone>${id}${this.forKey}`]
    }

    return node
  }
  for(id, list, cb) {
    // const origin = this.nodeMap[id]
    const node = this.$(id)
    let comment = node['#for<comment>']
    if (!comment) {
      comment = createComment('for', Component.debug)
      node['#for<comment>'] = comment
      comment['#//for<node>'] = node
      replace(node, comment)
    }

    const forKey = this.forKey
    const cloneNodeMap =
      node['#cloneNodes'] || (node['#cloneNodes'] = new Map())
    // ++
    each(list, (item, key, index) => {
      this.forKey = `${forKey}.${key}` // *** for + for => id.for1key.for2key
      let cloneNode = cloneNodeMap.get(key)

      // clone
      if (!cloneNode) {
        cloneNode = cloneWithId(node, this.forKey)
        cloneNodeMap.set(key, cloneNode)
        // cloneNode['#key'] = key
        // cloneNode['#for<node>'] = node
      }

      // insert: ! for(true)+if(false)
      if (cloneNode['#if(bool)'] !== false && !cloneNode['#component']) {
        if (!cloneNode['#for(item)']) {
          insert(cloneNode, comment)
        }
      }
      cloneNode['#for.noRemove'] = true

      // >>>
      cb.call(this, item, key, index)
    })
    this.forKey = forKey

    // --
    each(cloneNodeMap, ([key, cloneNode]) => {
      if (!cloneNode['#for.noRemove']) {
        remove(cloneNode)
        cloneNode['#if<comment>'] && remove(cloneNode['#if<comment>'])
        // delete cloneNode['#if<comment>']
        cloneNode['#component']?.destory()
        delete cloneNode['#if(bool)']
        cloneNode['#for(item)'] = false

        // !delete: reuse
        // delete cloneNodeMap['key:' + cloneNode['#key']] // todo: for+for length--
        // delete origin[`#<clone>${cloneNode['#id']}`]
      } else {
        delete cloneNode['#for.noRemove']
        cloneNode['#for(item)'] = true
      }
    })
  }
  if(id, bool, cb) {
    const node = this.$(id)
    const lastBool = '#if(bool)' in node ? node['#if(bool)'] : true
    let comment = node['#if<comment>']
    const component = node['#component']

    if (!!bool !== !!lastBool) {
      node['#if(bool)'] = bool
      if (bool) {
        replace(comment, node)
      } else {
        if (!comment) {
          comment = createComment('if', Component.debug)
          node['#if<comment>'] = comment
          comment['#//if<node>'] = node
        }
        replace(node, comment)
        if (component) {
          replace(component.childNodes[0], comment)
          component.destory()
        }
      }
    }

    if (bool) {
      cb.call(this)
    }

    const self = this
    return {
      elseif(id, bool_, cb) {
        self.if(id, !bool && bool_, cb)
        if (!bool && bool_) bool = true
        return this
      },
      else(id, cb) {
        self.if(id, !bool, cb)
      },
    }
  }
  new(id, Class, mode) {
    const target = this.$(id)
    const self = this

    if (Class?.then) {
      Class.then((Class) => newOrRender(target, Class))
    } else {
      newOrRender(target, Class)
    }

    /**
     *
     * @param {Element} node
     * @param {function} Class
     */
    function newOrRender(node, Class) {
      if (Class === Component || Class?.prototype instanceof Component) {
        let component = node['#component']
        // new
        if (!component) {
          component = new Class({ target, mode })
          component.parentComponent = self
          self.childComponents.push(component)
          target['#component'] = component
        }
        // render
        else {
          // TODO props && diff
          component.render()
        }
      }
    }
  }
  onbeforeunload() {
    console.log('onbeforeunload', this)
  }
  mount(target, mode) {}
  destory() {
    this.onbeforeunload()

    each(this.childNodes, remove)
    delete this.target['#component']
  }
  static defineSetter(name, setter) {
    Component.propSetters[name] = setter
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
      this.style[name] = value

      // number+'px'
      if (typeof value === 'number') {
        if (Number(this.style[name]) !== value) {
          this.style[name] = value + 'px'
        }
      }
    }
  },
}

/**
 *
 * @param {string} html
 * @param {string} className
 * @returns {Component}
 */
function loader(html, className = '') {
  const _container = parseHTML(html)
  const { scriptCode, updatePropsCode, code } = compile(_container)

  // - <script>
  Array(..._container.getElementsByTagName('script')).forEach(remove)

  return Function(
    'Component',
    `return class ${className} extends Component {
  static tpl = \`${_container.innerHTML.replace(/[\\`$]/g, '\\$&')}\`

  render(){
    const self = this

    // <script>
    ${scriptCode}
    // </script>

    this.updateProps = function () {
      ${updatePropsCode}
    }
    this.render = function(){
      this.updateProps()
      ${code}
    }
    this.render()
  }
}`
  )(Component)
}

const HelloWorld = loader(
  `
  <hr>
  <div>Hello \${value}</div>
  <button onclick="x++">\${x}</button>
  <hr>

  <script>
    var value = 'world'
    var x = 1
  </script>
  `,
  'HelloWorld'
)

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

      this.render = Function(`
        var self = this

        this.render = function(){
          ${code}
        }
        this.render()
      `)

      node['#//component'] = this
      this.render()
    }
  }

  const app = new Index()

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

export { Component as default, Component, loader, HelloWorld }
