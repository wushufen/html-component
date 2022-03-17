import { hasOwnProperty, each } from './utils.js'
import {
  insert,
  remove,
  replace,
  parseHTML,
  createFragment,
  createComment,
} from './dom.js'
import { createPropsUpdateCode } from './parse.js'
import { compile, NodeMap, cloneWithId } from './compile.js'

class Component {
  static debug = !false
  static compiledTpl = `
    <!-- default -->
  `
  render() {
    // default
  }
  $render() {
    const self = this
    Promise.resolve().then(function () {
      self.render()
    })
  }

  props = {}
  childComponents = []
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

      const { scriptCode, vars, code } = compile(node)
      this.fragment = isStringTpl ? createFragment(node.childNodes) : node
      this.nodeMap = NodeMap(this.fragment)
      this.childNodes = isStringTpl ? [this.fragment] : [node]

      this.render = Function(`
        var self = this

        ${isStringTpl ? scriptCode : `// <script>...</script>`}

        this.updateProps = function () {
          ${createPropsUpdateCode(vars, 'this.props')}
        }

        this.render = function(){
          // props
          this.updateProps()

          // dom
          ${code}
        }
        this.render()
      `)
    }
    console.log('com', this)
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

    try {
      node[name] = value
    } catch (error) {
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
      cb?.call(this)
    }

    const self = this
    return {
      elseif(id, bool_, cb) {
        if (!bool && bool_) {
          self.if(id, true)
          cb.call(self)
          bool = true
        } else {
          self.if(id, false)
        }
        return this
      },
      else(id, cb) {
        if (bool) {
          self.if(id, false)
        } else {
          self.if(id, true)
          cb.call(self)
        }
      },
    }
  }
  new(id, Class) {
    const node = this.$(id)
    const self = this

    if (Class?.then) {
      Class.then((Class) => newOrRender(node, Class))
    } else {
      newOrRender(node, Class)
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
          component = new Class()
          component.target = node
          component.props = node['#props'] || {}
          self.childComponents.push(component)
          node['#component'] = component

          const place = createComment('new', Component.debug)
          insert(place, node)
          place['#//node'] = node

          // replace(node, component.fragment)
          insert(component.fragment, place)

          // const shadow = node.attachShadow({ mode: 'open' })
          // shadow.appendChild(component.fragment)
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

Component.defineSetter('debug', function (value) {
  console.log('debug:', value)
  // eslint-disable-next-line no-debugger
  debugger
})

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
    <text id="1#">Time: \${date.toJSON()}</text>
  `
  render() {
    var self = this

    // <script>
    let date = new Date()
    setInterval(function () {
      self.$render() // injected
      date = new Date()
    }, 1000 / 60)
    // </script>

    // compiledCode
    self.render = function () {
      self.text('1', `Time: ${date.toJSON()}`)
    }
    self.render()
  }
}

class Tree extends Component {
  static compiledTpl = `
    <ul>
      <li id=1 for="const item of tree">
        <strong><t id="2#">\${item}</t></strong>
        <ul id=3 new="self.constructor" .tree="[...item.children]"></ul>
      </li>
    </ul>
  `
  render() {
    var self = this

    // <script>

    var tree = [
      {
        name: 'default',
        children: [],
      },
    ]

    // </script>

    this.updateProps = function () {
      'tree' in this.props && (tree = this.props.tree)
    }

    this.render = function () {
      // props
      this.updateProps()

      // dom

      // <div>

      // <ul>

      // <li for="const item of tree">
      self.for('1', tree, function (item, $key, $index) {
        // <strong>

        // ${item}
        self.text('2', '' + self.exp(item) + '')

        // <ul new="self.constructor" .tree="[...item.children]">
        self.prop('3', 'tree', function () {
          return [...item.children]
        })
        self.new('3', self.constructor)
      })

      // <script>
    }
    this.render()
  }
}

export default Component
export { Component, HelloWorld, Time, Tree }
