import { hasOwnProperty, each } from './utils.js'
import {
  insertBefore,
  insertAfter,
  remove,
  replace,
  append,
  parseHTML,
  Anchor,
} from './dom.js'
import { getNodeMap, cloneNodeTree } from './compile.js'
import {} from './index.js'
Anchor.debug = true

class Component {
  // <el ID>
  static tpl = ``
  // code
  render() {}
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
  constructor({ target, mode } = {}) {
    if (target) {
      const _container = parseHTML(this.constructor.tpl)
      // id => node
      this.nodeMap = getNodeMap(_container)
      this.childNodes = Array.from(_container.childNodes)

      // target
      this.target = target
      this.props = target['#props'] || {}
      const COMPONENT_START = Anchor(Anchor.COMPONENT_START)
      const COMPONENT_END = Anchor(Anchor.COMPONENT_END)
      insertBefore(COMPONENT_START, target)
      insertAfter(COMPONENT_END, target)
      COMPONENT_START['#//<target>'] = target
      COMPONENT_END['#//<target>'] = target

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
    let forStart = node[Anchor.FOR_START]
    let forEnd = node[Anchor.FOR_END]
    if (!forStart) {
      forStart = Anchor(Anchor.FOR_START)
      node[Anchor.FOR_START] = forStart
      forStart['#//for<node>'] = node
      insertBefore(forStart, node)
    }
    if (!forEnd) {
      forEnd = Anchor(Anchor.FOR_END)
      node[Anchor.FOR_END] = forEnd
      forEnd['#//for<node>'] = node
      replace(node, forEnd)
    }

    // [[item,cloneNode], ...]
    const cloneNodeList =
      node['#cloneNodeList'] || (node['#cloneNodeList'] = [])
    const currentCloneNodeList = []
    let lastCloneNode = forStart

    // ++
    each(list, (item, key, index) => {
      let cloneNode = null
      for (let length = cloneNodeList.length; length; ) {
        const [_item, _cloneNode] = cloneNodeList[0]
        // [1,...]
        // [1,...]
        if (_item === item) {
          cloneNode = _cloneNode
          cloneNodeList.shift()
          break
        } else {
          cloneNodeList.push(cloneNodeList.shift()) // [1,...] => [..., 1]
          length--
          // [1,2,3]
          // [2,3]
          remove(_cloneNode)

          // TODO
          // [1,2,3]
          // [0,1,2,3]
        }
      }
      // clone
      cloneNode = cloneNode || cloneNodeTree(node)

      // insert: ! for(true)+if(false)
      if (cloneNode['#if(bool)'] !== false && !cloneNode['#component']) {
        insertAfter(cloneNode, lastCloneNode)
      }

      // >>>
      this.currentCloneNode = cloneNode
      cb.call(this, item, key, index)
      delete this.currentCloneNode

      // next
      lastCloneNode = cloneNode
      currentCloneNodeList.push([item, cloneNode])
    })
    node['#cloneNodeList'] = currentCloneNodeList

    // --
    each(cloneNodeList, ([, cloneNode]) => {
      remove(cloneNode)
      cloneNode[Anchor.IF] && remove(cloneNode[Anchor.IF])
      // delete cloneNode[Anchor.IF]
      cloneNode['#component']?.destory()
      delete cloneNode['#if(bool)']
    })
  }
  if(id, bool, cb) {
    const node = this.$(id)
    const lastBool = '#if(bool)' in node ? node['#if(bool)'] : true
    let comment = node[Anchor.IF]
    const component = node['#component']

    if (!!bool !== !!lastBool) {
      node['#if(bool)'] = bool
      if (bool) {
        replace(comment, node)
      } else {
        if (!comment) {
          comment = Anchor(Anchor.IF)
          node[Anchor.IF] = comment
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
