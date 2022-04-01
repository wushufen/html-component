import { hasOwnProperty, each, deepClone, deepSame } from './utils.js'
import {
  insertBefore,
  insertAfter,
  remove,
  replace,
  append,
  parseHTML,
  Fragment,
} from './dom.js'
import { Anchor, ifAnchor, IF_FALSE } from './Anchor.js'
import { getNodeMap, cloneNodeTree } from './compile.js'
import {} from './index.js'
Anchor.debug = true

class Component {
  // <el ID>
  static tpl = `
  <!-- tpl[id] -->
  `
  lastProps = {}
  props = {}
  target = null
  childNodes = null
  nodeMap = null
  parentComponent = null
  childComponents = []
  constructor({ target, mode } = {}) {
    const wrapper = parseHTML(this.constructor.tpl)
    // id => node
    this.nodeMap = getNodeMap(wrapper)
    this.childNodes = Array.from(wrapper.childNodes)
    this.childNodes.forEach((childNode) => (childNode['#//component'] = this))

    this.create()

    if (target) {
      this.mount(target, mode)
    }
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
    if (node['#nodeValue'] === value) return

    node.nodeValue = value
    node['#nodeValue'] = value
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
   *   self.prop(2, 'title', item)           // 1 + item => 1' => 2'
   *   self.for(3, item, function(c, k){     //             1' => 3'
   *     self.prop(4, 'title', c)            // 3' + c   => 3''=> 4''
   *   })
   * })
   */
  $(id) {
    let node = this.nodeMap[id]
    if (this.currentCloneNode) {
      node = this.currentCloneNode[`#<clone>${id}`]
    }

    return node
  }
  for(id, list, cb) {
    // const origin = this.nodeMap[id]
    const node = this.$(id)
    let FOR_START = node[Anchor.FOR_START]
    let FOR_END = node[Anchor.FOR_END]
    if (!FOR_START) {
      FOR_START = Anchor(node, Anchor.FOR_START)
      FOR_END = Anchor(node, Anchor.FOR_END)
      insertBefore(FOR_START, node)
      insertAfter(FOR_END, node)
      remove(node)
    }

    // [[item,cloneNode], ...]
    const cloneNodeList =
      node['#cloneNodeList'] || (node['#cloneNodeList'] = [])
    const currentCloneNodeList = []
    let lastCloneNode = FOR_START

    // ++
    const isArrayList = list instanceof Array
    const isMapList = typeof Map !== 'undefined' && list instanceof Map
    each(list, (item, key, index) => {
      let cloneNode = null
      const itemKey = isArrayList ? item : isMapList ? item[0] : key
      // const itemKey = key

      for (let length = cloneNodeList.length; length; ) {
        const [_itemKey, _cloneNode] = cloneNodeList[0]
        // [1,...]
        // [1,...]
        if (_itemKey === itemKey) {
          cloneNode = _cloneNode
          cloneNodeList.shift()
          break
        }
        // deleted || moved
        else {
          cloneNodeList.push(cloneNodeList.shift()) // [1,...] => [..., 1]
          length--
          // [1,2,3]
          // [2,3]
          if (!_cloneNode['#component']) {
            remove(ifAnchor(_cloneNode))
          } else {
            _cloneNode['#component'].childNodes.forEach((_childNode) =>
              remove(ifAnchor(_childNode))
            )
          }

          // TODO
          // [1,2,3]
          // [0,1,2,3]
        }
      }
      // clone
      cloneNode = cloneNode || cloneNodeTree(node)
      cloneNode['#//item'] = item

      // insertAfter
      const cloneNodeComponent = cloneNode['#component']
      const lastCloneNodeComponent = lastCloneNode['#component']
      const preNode = lastCloneNode[IF_FALSE]
        ? lastCloneNode[Anchor.IF]
        : lastCloneNodeComponent
        ? ifAnchor(lastCloneNodeComponent.childNodes.slice(-1)[0])
        : lastCloneNode
      if (!cloneNodeComponent) {
        insertAfter(ifAnchor(cloneNode), preNode)
      } else {
        if (
          preNode.nextSibling !== ifAnchor(cloneNodeComponent.childNodes[0])
        ) {
          insertAfter(
            Fragment(cloneNodeComponent.childNodes.map(ifAnchor)),
            preNode
          )
        }
      }

      // >>>
      this.currentCloneNode = cloneNode
      cb.call(this, item, key, index)
      delete this.currentCloneNode

      // next
      lastCloneNode = cloneNode
      currentCloneNodeList.push([itemKey, cloneNode, item])
    })
    node['#cloneNodeList'] = currentCloneNodeList

    // --
    cloneNodeList.forEach(([, cloneNode]) => {
      if (!cloneNode['#component']) {
        remove(ifAnchor(cloneNode))
      } else {
        cloneNode['#component']?.destory()
      }
    })
  }
  if(id, bool, cb) {
    const node = this.$(id)
    const component = node['#component']
    const lastBool = !node[IF_FALSE]
    const IF = node[Anchor.IF] || (node[Anchor.IF] = Anchor(node, Anchor.IF))

    if (!!bool !== lastBool) {
      node[IF_FALSE] = !bool
      // true
      if (bool) {
        if (!component) {
          replace(node, IF)
        } else {
          replace(Fragment(component.childNodes.map(ifAnchor)), IF)
        }
      }
      // false
      else {
        if (!component) {
          replace(IF, node)
        } else {
          insertBefore(IF, ifAnchor(component.childNodes[0]))
          component.childNodes.forEach((childNode) =>
            remove(ifAnchor(childNode))
          )
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
        } else {
          // onchange
          if (!deepSame(component.props, component.lastProps)) {
            const event = new Event('change')
            event.props = event.data = component.props
            event.lastProps = component.lastProps

            component.onchange(event) // render
          }
        }

        component.lastProps = deepClone(component.props)
      }
    }
  }
  // new => create (var+render)
  // mount => +dom => onload => render
  // props => onchange => render => *N
  // destory => -dom => onunload
  create() {
    // const self = this

    // <script>
    // var value = 1
    // </script>

    // code
    this.render = function () {
      // self.text('1', `${value}`)
    }
  }
  mount(target, mode) {
    const self = this

    // target
    this.target = target
    this.props = target['#props'] || {}

    // insert this.childNodes
    if (mode === 'web') {
      if (target.shadowRoot) {
        target.shadowRoot.innerHTML = ''
      } else {
        target.attachShadow({ mode: 'open' })
      }
      append(target.shadowRoot, Fragment(this.childNodes))
    } else if (mode === 'wrap') {
      append(target, Fragment(this.childNodes))
    } else {
      replace(Fragment(this.childNodes), target)
    }

    // onload
    const event = new Event('load')
    event.data = this.props
    event.props = this.props
    target.addEventListener('load', function load(e) {
      target.removeEventListener('load', load)
      self.onload(e)
    })
    target.dispatchEvent(event)
  }
  onload() {
    this.render()
  }
  onchange() {
    this.render()
  }
  onunload() {
    // console.log('onunload', this)
  }
  destory() {
    const self = this
    const target = this.target

    // -dom
    delete target['#component']
    this.childNodes.forEach((childNode) => remove(ifAnchor(childNode)))

    // onunload
    const event = new Event('unload')
    target.addEventListener('unload', function unload(e) {
      target.removeEventListener('unload', unload)
      self.onunload(e)
    })
    target.dispatchEvent(event)

    // -childComponents
    this.parentComponent.childComponents.splice(
      this.parentComponent.childComponents.indexOf(this),
      1
    )
    this.childComponents.forEach((childComponent) => childComponent.destory())
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
  static definePropSetter(name, setter) {
    Component.propSetters[name] = setter
  }
  static propSetters = {
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
}

export { Component as default, Component }
