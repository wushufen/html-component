// node => 'id++: <node ...>'
function getNodeId(node) {
  if (node.$id) {
    return node.$id
  }

  getNodeId.i = getNodeId.i || 0
  var nodeString = node.nodeValue || node.cloneNode().outerHTML
  if (node.nodeType === 2) {
    nodeString = `[${node.nodeName}=${node.nodeValue}]`
  }
  var id = `${++getNodeId.i}: ${nodeString} `
    .replace(/\s+/g, ' ')
    .replace(/'/g, '"')
    .replace(/\\/g, '')
  return id
}

// node => store => id
function saveNode(node, id, store=saveNode) {
  node.$id = id || getNodeId(node)
  store[node.$id] = node
  return node.$id
}

// id => store[id] => node
function getNode(id, store=saveNode) {
  return store[id]
}

// {length} => []
function toArray(arrayLike, start) {
  var array = []
  if (!arrayLike) return array
  var i = arrayLike.length
  while (i--) array[i] = arrayLike[i]
  return array.slice(start)
}

// [] -> each
function forEach(arrayLike, fn) {
  if (!arrayLike) return
  for (var i = 0; i < arrayLike.length; i++) {
    var rs = fn.call(this, arrayLike[i], i)
    if (rs !== undefined) return rs // can break
  }
}

// [] | {} -> each
function each(list, cb) {
  if (list instanceof Array) {
    forEach(list, function (item, i) {
      cb(item, i, i)
    })
  } else {
    var index = 0
    for (var key in list) {
      if (Object.hasOwnProperty.call(list, key)) {
        var item = list[key]
        cb(item, key, index++)
      }
    }
  }
}

// 'innerhtml' => 'innerHTML'
function attr2prop(node, attr) {
  var prop = attr2prop[`prop:${attr}`] // cache
  if(prop) return prop

  for (var prop in node) {
    if (prop.toLowerCase() === attr) {
      attr2prop[`prop:${attr}`] = prop
      return prop
    }
  }

  attr = {
    class: 'className',
  }[attr] || attr

  return attr
}

// node -> <node><!-- mark --> => mark
// node.$ifMark
// node.$forMark
function markNode(node, markType) {
  if (node[markType]) return node[markType]
  var mark = document.createComment(node.cloneNode().outerHTML)
  // var mark = document.createTextNode('')
  node.parentNode.insertBefore(mark, node)
  node[markType] = mark
  mark.$node = node
  return mark
}

// node -> -
function removeNode(node) {
  if (!node.parentNode) return
  node.parentNode.removeChild(node)
}

// node, mark -> <node><!-- mark -->
function insertNode(node, mark) {
  if (node.parentNode) return
  mark.parentNode.insertBefore(node, mark)
}

// bool? insertNode: removeNode
function $if(node, bool, cb) {
  node = node.$component ? node.$component.$el : node // $is?

  if (bool) {
    insertNode(node, node.$ifMark)
    cb && cb.call(this)
  } else {
    node.$ifMark = markNode(node, '$ifMark')
    removeNode(node)
  }
}

// node + [] -> [cloneNode]
function $for(node, list, cb) {
  node.$forMark = markNode(node, '$forMark')
  removeNode(node)
  node.$cloneNodes = node.$cloneNodes || {}
  var $cloneNodes = node.$cloneNodes // {node+key=>cloneNode}

  // for:start
  var $component = this.$component || {}
  var $forPath = $component.$forPath || '' // ***
  each.call(this, list, function (item, key, index) {
    $component.$forPath = `${$forPath}#${key}` // *** ''+'#key' => '#i#j#k'

    // node+key=>cloneNode
    var cloneNode = $cloneNodes[key]

    // ++ clone
    if (!cloneNode) {
      cloneNode = node.cloneNode(true)
      cloneNode.$node = node // cloneNode => node
      $cloneNodes[key] = cloneNode // save: key=>cloneNode
      cloneNode.$forMark = node.$forMark // insertBefore $forMark
      insertNode(cloneNode, cloneNode.$forMark)

      // node childNodes + $forPath => itemNode childNodes
      !(function loopTree(node, cloneNode) {
        cloneNode.$forPath = $component.$forPath // dev
        /****************************************
        <li for>
          <span for> originNode </span>
        </li >
        ========================================>
        <li for remove>
          <span for> originNode ○ </span>
        </li >
        <li>
          <span for> cloneNode △ </span>
        </li >
        ========================================>
        <li>
          <span for remove> cloneNode △ </span>
          <span> cloneNode △ △ </span>
        </li >
        ========================================>
        <li>
          <span> cloneNode △ △ </span>
        </li >
        ========================================>
        originNodeId + forPath => cloneNode
        ****************************************/
        cloneNode.$originNode = node.$originNode || node

        var originNode = cloneNode.$originNode
        var originNodeId = getNodeId(originNode)

        // originNodeId + forPath => cloneNode
        if (getNode(originNodeId)) {
          saveNode(cloneNode, originNodeId + $component.$forPath) // ***
        }

        // 存放在初始节点上也是一种可行的方式
        // originNode.$forPathNodes = originNode.$forPathNodes || {}
        // originNode.$forPathNodes[$component.$forPath] = itemNode

        forEach(node.childNodes, function (childNode, i) {
          loopTree(childNode, cloneNode.childNodes[i])
        })
      })(node, cloneNode)
    } else {
      // ++ length
      $if.call(this, cloneNode, true)
    }

    // for: >>>
    cb && cb.call(this, item, key, index)
  })
  this.$component.$forPath = $forPath // *** for:end

  // -- length
  each.call(this, $cloneNodes, function (cloneNode, key) {
    if (!Object.hasOwnProperty.call(list, key)) {
      // TODO cg
      $if.call(this, cloneNode, false)
    }
  })
}

// node[prop] = value
function $prop(node, prop, value) {
  node.$props = node.$props || {}

  // on
  // render 每次都是匿名函数
  if (typeof node.$props[prop] === 'function') {
    // return
  }

  if (node.$props[prop] !== value) { // cache
    node[prop] = value
    node.$props[prop] = value
  }
}

// node -> $component.$render()
// x: $is('<html>', 'html')
// x: $is(node, alert)
// x: $is(node, new Promise(r=>null))
function $is(node, SubComponent) {
  if (node.$component && typeof SubComponent === 'function') {
    node.$component.$render(node.$props)
    return
  }

  if (SubComponent && SubComponent.then) {
    SubComponent.then(SubComponent => create(SubComponent, node))
    return
  }

  create(SubComponent, node)

  function create(SubComponent, node) {
    if (typeof SubComponent === 'function' && SubComponent.prototype.$mount) {
      var component = new SubComponent()
      component.$mount(node)
    }
  }
}

// `  \  "  \n  ` => `"  \\  \"  \\n  "`
function quot(string, q = '"') {
  return `${q}${
    string
      .replace(/\\/g, '\\\\') // \=>\\
      .replace(/['"]/g, '\\$&') // '=>\'  "=>\"
      .replace(/\r?\n/g, '\\n') // \n=>`\\n`
  }${q}`
}

// `t {1} {2} t` => `"t " +(1)+ " " +(2)+ " t"`
function parseExp(text, expLeft = '{', expRight = '}') {
  return (
    text
    // {exp} {`${e}{}\``}
      .replace(RegExp(`(\\${expLeft})(("(\\.|[^])*?"|'(\\.|[^])*?'|\`(\\.|[^])*?\`|\{[^]*?\}|[^])*?)(\\${expRight})`, 'g'), '\f +($2)+ \f')
      // }text{
      .replace(
        RegExp('(^|\f)([^]*?)(\f|$)', 'g'),
        function ($a, $1, $2, $3) {
          return quot($2)
        },
      )
  )
}

// `var x; let y /* var z */` => ['x', 'y']
function getVarNames(code, cb) {
  code = code.replace(/\/\/.*|\/\*[^]*?\*\//g, '') // - //  /**/
  var vars = []
  var reg = /(var|let|const)(\s+)(.*?)(\s|=|,|;|$)/g
  var m
  while (m = reg.exec(code)) {
    var n = m[3]
    vars.push(n)
    cb && cb(n)
  }
  return vars
}

// ["x"] => `!!("x" in props) && (x=props.x)`
function getUpdatePropsCode(vars, propsName = 'props') {
  var string = '\n'
  vars.forEach(function (name) {
    string += `!!("${name}" in ${propsName}) && (${name}=${propsName}.${name})\n`
  })
  return string
}

// code => error? throw 🐞🐞
function detectTemplateError(code, errorNode) {
  try {
    Function(code)
  } catch (error) {
    try {
      Function(`(${code})`) // (function(){})
    } catch (_) {
      code = code.replace(/;"#(.*?)#";/g, '$1')

      var parentNode  = errorNode.parentNode || errorNode.ownerElement || errorNode
      errorNode = errorNode.cloneNode()
      var errorTpl = errorNode.outerHTML || errorNode.nodeValue
      errorTpl = errorTpl.replace(/<\/.*?>/, '')
      errorTpl = parentNode.outerHTML.replace(errorTpl, '🐞' + errorTpl + '🐞')

      console.error(errorNode)
      throw Error(`[TemplateError] ${error}\n\n${code}\n^\n${errorTpl}\n`)
    // setTimeout(e => { throw Error('[TemplateError]\n  ' + errorTpl) })
    }
  }
}

/**
  @example

  <div class="container">
    <h1> Hello {name} </h1>

    <ul>
      <li for="(var item in list)" onclick="alert(item)">
        <span if="item">{item}</span>
        <button>button</button>
      </li>
    </ul>
  </div>

  =>

  $_('1: Hello {name} ').$prop("nodeValue", " Hello " + (name) + " ")
  $_('2: <li onclick="alert(item)"></li> ').$for(list, function(item) {
    $_('3: <span></span> ').$if(item, function() {
      $_('4: {item} ').$prop("nodeValue", "" + (item) + "")
    })
    $_('2: <li onclick="alert(item)"></li> ').$prop("onclick", function() {
      alert(item);
      $RENDER()
    })
  })

 * @param {Node} node
 * @returns {Function} render
 */
function compile(node = document.documentElement) {
  var rootNode = node
  var rootHtml = node.outerHTML
  var initCode = '\n'
  var renderCode = '\n'
  var scriptTagsCode = '\n'
  var styleTagsCode = '\n'
  var isGlobal = node == document.documentElement

  node.querySelectorAll('script').forEach(e=>scriptTagsCode+=e.innerHTML)
  node.querySelectorAll('style').forEach(e=>styleTagsCode+=e.innerHTML)
  var varNames = getVarNames(scriptTagsCode)

  !(function loopNodeTree(node) {
    // <script>
    if (/^script$/i.test(node.tagName)) {
      // scriptTagsCode += node.innerHTML + '\n'
      return
    }

    // template[name]
    if (/^template$/i.test(node.tagName)) {
      var name = node.getAttribute('name')
      varNames.push(name) // for <SubCom>
      initCode += `
        var ${name} = this.constructor.prototype.${name}
        if(!${name}){
          var ${name} = this.defineSubComponentClass(${quot(node.innerHTML)})
          this.constructor.prototype.${name} = ${name}
        }
      `
      return
    }

    // skip
    if (/^(skip|script|style|template)$/i.test(node.tagName)) return

    // text{exp}
    if (node.nodeType === 3 && /\{[^]*?\}/.test(node.nodeValue)) {
      var id = saveNode(node)
      var exp = parseExp(node.nodeValue)
      renderCode += `$_('${id}').$prop("nodeValue", ${exp})\n`

      detectTemplateError(exp, node)
      return
    }



    // for
    // for="item in list"
    // for="(item, i) in list"
    // for="(item, key, i) in list"
    // for="var key in list"
    // for="var item of list"
    var forAttr = node.getAttribute && node.getAttribute('for')
    var forMatch = /([^(,)\s]+)()()(?:\s+in\s+)([^(,)\s]+)/.exec(forAttr) ||
      /\(\s*([^(,)\s]+)\s*,\s*([^(,)\s]+)()\s*\)(?:\s+in\s+)([^(,)\s]+)/.exec(forAttr) ||
      /\(\s*([^(,)\s]+)\s*,\s*([^(,)\s]+)\s*,\s*([^(,)\s]+)\s*\)(?:\s+in\s+)([^(,)\s]+)/.exec(forAttr) ||
      /(?:var|let|const)(?:\s+)()([^(,)\s]+)()(?:\s+in\s+)([^(,)\s]+)/.exec(forAttr) ||
      /(?:var|let|const)(?:\s+)([^(,)\s]+)()()(?:\s+of\s+)([^(,)\s]+)/.exec(forAttr)
    if (forMatch) {
      var id = saveNode(node)
      renderCode += `$_('${id}').$for(${forMatch[4]}, function(${forMatch[1]||'$item'},${forMatch[2]||'$index'},${forMatch[3]||'$key'}){\n  `

      detectTemplateError(forAttr.replace(/var|let|const/g, ';"#$&#";').replace(/of/, ';"#$&#";'), node)
      node.removeAttribute('for')
    }

    // if
    var ifAttr = node.getAttribute && node.getAttribute('if')
    if (ifAttr) {
      var id = saveNode(node)
      renderCode += `$_('${id}').$if(${ifAttr}, function(){\n  `

      detectTemplateError(ifAttr, node)
      node.removeAttribute('if')
    }



    // [attr]
    forEach(toArray(node.attributes), function (attribute) {
      var attrName = attribute.nodeName
      var attrValue = attribute.nodeValue

      // class="a b:bool c:!bool"
      if (/^class$/i.test(attrName) && /:/.test(attrValue)) {
        // "b:bool" => "{bool?'b':''}"
        attrValue = attrValue.replace(/([^'"\s]+):([^'"\s]+)/g, '{$2?"$1":""}')
      }

      // style="width:_n_px; height:[n]px"
      if (/^style$/i.test(attrName) && /([_\[])(.+?)([_\]])/.test(attrValue)) {
        // [] => {}  _n_ => {n}
        attrValue = attrValue.replace(/([_\[])(.+?)([_\]])/g, '{$2}')
      }

      // bind 
      if (/^[\.:]value/.test(attrName)) {
        // renderCode += `$_('${id}').$on('bind:input', function(e){${attrValue}=this.value})\n` // TODO
      }

      // .attr :attr
      if (/^[\.:]/.test(attrName)) {
        var id = saveNode(node)
        var prop = attr2prop(node, attrName.substr(1))
        renderCode += `$_('${id}').$prop("${prop}", ${attrValue})\n`

        detectTemplateError(attrValue, attribute)
        node.removeAttribute(attrName)
        return
      }

      // attr="{}"
      if (/\{[^]*?\}/.test(attrValue)) {
        var id = saveNode(node)
        var prop = attr2prop(node, attrName)
        var exp = parseExp(attrValue)
        renderCode += `$_('${id}').$prop("${prop}", ${exp})\n`

        detectTemplateError(exp, attribute)
        node.removeAttribute(attrName)
        return
      }

      // on @
      // TODO component dispatch bubbles
      if (/^(on|@)/.test(attrName)) {
        var id = saveNode(node)
        // TODO render
        // TODO 拦截异步函数 + 事件处理函数 + 恢复异步函数
        renderCode += `$_('${id}').$prop("${attrName.replace('@', 'on')}", function(){${attrValue}; $RENDER.call($THIS)})\n`

        detectTemplateError(attrValue, attribute)
        node.removeAttribute(attrName)
        return
      }

      // $="el"
      if (/^\$$/.test(attrName)) {
        var id = saveNode(node)
        renderCode += `;${attrValue}=$_('${id}').node\n`

        detectTemplateError(`(${attrValue})`, attribute)
        node.removeAttribute('$')
      }

    })


    // is="SubCom"
    var isAttr = node.getAttribute && node.getAttribute('is')
    if (isAttr) {
      var id = saveNode(node)
      renderCode += `$_('${id}').$is(${isAttr})\n`

      detectTemplateError(isAttr, node)
      node.removeAttribute('isAttr')
    }
    // <SubCom />
    // TODO 如何区分是否自定义标签
    if (!isAttr && node.tagName && node.tagName.length>=2) {
      for (let varName of varNames) {
        // var SubCom, tagName SUBCOM
        if (/^[A-Z][a-z]/ && RegExp(`^${varName}$`, 'i').test(node.tagName)) {
          var id = saveNode(node)
          renderCode += `$_('${id}').$is(${varName})\n`
          break
        }
      }
    }



    // >>>
    for (var i = 0, length = node.childNodes.length; i < length; i++) {
      loopNodeTree(node.childNodes[i])
    }



    // end if
    if (ifAttr) {
      renderCode += '}.bind(this))\n'
    }

    // end for
    if (forMatch) {
      renderCode += '}.bind(this))\n'
    }

    // warn for+if
    if (forMatch && ifAttr) {
      console.warn('[TemplateWarn] for+if', node)
    }
  })(node)

  var getRender = new Function(`
    // debugger
    var $THIS = this
  
    // async function
    // TODO this.setTimeout auto clearTimeout
    var setTimeout = function(cb, time){
      return window.setTimeout(function(){
        cb()
        $RENDER.call($THIS)
      }, time) 
    }
    var setInterval = function(cb, time){
      return window.setInterval(function(){
        cb()
        $RENDER.call($THIS)
      }, time) 
    }

    // INIT
    ${initCode}

    // <script>
    ${isGlobal ? '/* global */' : scriptTagsCode}

    var $RENDER = function $RENDER($props){
      // this
      var $_ = this.$_

      // TODO preProps... = props... return

      // props
      $props = $props || {}
      // console.log('$props', $props)
      ${getUpdatePropsCode(varNames, '$props')}

      // renderCode
      ${renderCode}
    }
    return $RENDER
    /*
    \n${rootHtml.replace(/\*\//g, '*\\/')}
    */
  `)

  return getRender
}

// id => node
function $_(id, component) {
  if (!(this instanceof $_)) {
    return new $_(arguments[0], arguments[1], arguments[2])
  }

  this.$component = component || this.$component
  this.node = getNode(id + this.$component.$forPath) // ***
}
$_.prototype = {
  $if(bool, cb) {
    return $if.call(this, this.node, bool, cb)
  },
  $for(list, cb) {
    return $for.call(this, this.node, list, cb)
  },
  $prop(name, value) {
    return $prop.call(this, this.node, name, value)
  },
  $is(SubComponent) {
    return $is.call(this, this.node, SubComponent)
  },
  $component: { // dev
    $forPath: '', // id+forPath=>cloneNode.id
  },
}

// TODO if for destroy
function Component(node) {
  if (!(this instanceof Component)) {
    return new Component(arguments[0], arguments[1], arguments[2])
  }
  var $component = this
  this.$forPath = ''

  this.$_ = function(id) {
    return new $_(id, $component)
  }

  this.$render = compile(node).call(this)
  this.$render.$_ = this.$_

  this.$node = node
  this.$node.$component = $component

  this.$el = document.createComment('$el')
  for (let i = 0; i < this.$node.children.length; i++) {
    const childNode = this.$node.children[i]
    if (!/style|script/i.test(childNode.tagName)) {
      this.$el = childNode
      break
    }
  }
  this.$el.$component = $component

}
Component.prototype = {
  constructor: Component,
  $forPath: '',
  $_: null,
  $render: null,
  $node: null,
  $el: null,
  // TODO
  setTimeout(time, cb) {
    return window.setTimeout(e=>{
      cb()
      this.$render()
    }, time)
  },
  setInterval(time, cb) {
    return window.setInterval(e=>{
      cb()
      this.$render()
    }, time)
  },
  XMLHttpRequest() {},
  fetch(url, options) {},
  addEventListener() {
  },
  dispatchEvent(e) {
    this.$el.dispatchEvent(e)
  },
  defineSubComponentClass,
  $mount(target) {
    this.$target = target // component => target
    target.$component = this // target => component

    if (target.parentNode) {
      this.$render(target.$props) // first render
      target.parentNode.replaceChild(this.$el, target)
    }
  },
}

class ComponentX{
  $forPath = ''
  $render = null
  $node = null
  $el = null
  $_(id) {
    return $_(id, this)
  }
}

// html => SubComponent
function defineSubComponentClass(html) {
  class SubComponent extends Component{
    constructor() {
      var container = parseHtml(html)

      // var component = new Component(container)
      super(container)
      var component = this

      return component
    }
  }
  SubComponent.toString = e=>html
  return SubComponent
}

// `html` => node
function parseHtml(html, tag = 'div') {
  var wrapper = document.createElement(tag)
  wrapper.innerHTML = html
  return wrapper
}

// url => await res
function http(url, options = {}) {
  var resolve
  var reject
  var promise = new Promise((s, j) => ((resolve = s), (reject = j)))

  var xhr = new XMLHttpRequest()
  xhr.open(options.method || 'GET', url, true)
  xhr.onload = e => resolve(xhr.response)
  xhr.onerror = reject
  xhr.send()

  return promise
}

// url => html => SubComponent
// #id => <template id> => SubComponent
function import_(url) {
  if (/^(#|\.|\[)/.test(url)){
    try {
      var templateEl = document.querySelector(url)
      var html = templateEl.innerHTML
      return defineSubComponentClass(html)
    } catch (_) {}
  }

  return http(url).then(html => {
    return defineSubComponentClass(html)
  })
}

// index.html
if (typeof window === 'object' && this === window) {
  // global async function
  var __setInterval = window.setInterval
  window.setInterval = function(cb, time){
    return __setInterval(function(){
      cb()
      $render()
    }, time)
  }
  var __setTimeout = window.setTimeout
  window.setTimeout = function(cb, time){
    return __setTimeout(function(){
      cb()
      $render()
    }, time)
  }
  var $render = function() {}

  addEventListener('DOMContentLoaded', function() {
    var component = Component(document.documentElement)
    component.$render({})

    $render = component.$render

    // global async function restore
    window.setTimeout = __setTimeout
    window.setInterval = __setInterval
  })
}

// loader
Component.import = import_
// TODO webpack loader
if (typeof require === 'undefined') {
  window.require = import_
}

// exports
if (typeof module === 'object') {
  module.exports = Component
}
