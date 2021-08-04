/*

  for_(id, list, function(item, key, index){
    if_(id, index%2==0, function(){
      prop_(id, 'title', key)
    })
  })

*/
class Component{
  constructor(tpl) {
    this.nodeMap = {
      length: 0,
    }
    this.forPath = '' // ***
    this.tpl = tpl
    this.node = null
    this.el = null

    this.compile(tpl)
  }
  saveNode(node) {
    var nodeString = node.nodeValue || node.cloneNode().outerHTML
    if (node.nodeType === 2) {
      nodeString = `[${node.nodeName}=${node.nodeValue}]`
    }

    var id = node.__id || `${this.nodeMap.length++}: ${nodeString} `
      .replace(/\s+/g, ' ')
      .replace(/'/g, '"')
      .replace(/\\/g, '')

    this.nodeMap[id] = node
    node.__id = id
    return id
  }
  getNode(id) {
    if (id && id.nodeType) { // node
      return id
    }

    id = `${id}${this.forPath}` // ***
    var node = this.nodeMap[id]
    if (!node) {
      throw id
    }
    return node
  }
  for(id, list, cb) {
    var this_ = this
    var node = this.getNode(id)
    var forMark = markNode(node, 'for')
    removeNode(node)
    var cloneNodes = node.__cloneNodes = node.__cloneNodes || {}
    // var fragment = document.createDocumentFragment()

    var forPath = this.forPath
    each(list, function(item, key, index) {
      this_.forPath = `${forPath}#${key}` // ***
      var cloneNode = cloneNodes[key]

      // ++
      if (!cloneNode) {
        cloneNode = node.cloneNode(true)
        cloneNode.__key = key
        cloneNodes[key] = cloneNode
        insertNode(cloneNode, forMark)
        // fragment.appendChild(cloneNode)

        saveCloneNode(cloneNode, node)
        function saveCloneNode(cloneNode, node) {
          cloneNode.__originNode = node.__originNode || node
          var originNodeId = cloneNode.__originNode.__id
          cloneNode.__id = `${originNodeId}${this_.forPath}` // ***
          this_.saveNode(cloneNode)

          forEach(cloneNode.childNodes, (e,i)=> saveCloneNode(e,node.childNodes[i]))
        }
      } else {
        // length++
        this_.if(cloneNode, true)
      }

      cb.call(this_, item, key, index)
    })
    this.forPath = forPath // ***
    // insertNode(fragment, forMark)

    // length--
    each(cloneNodes, function(cloneNode, key) {
      if (!Object.hasOwnProperty.call(list, key)) {
        // TODO destroy
        this_.if(cloneNode, false)
      }
    })
  }
  if(id, bool, cb) {
    var node = this.getNode(id)
    node = node.$component ? node.$component.el : node // $is?


    if (bool) {
      insertNode(node, node.__ifMark)
      cb && cb.call(this)
    } else {
      markNode(node, 'if')
      removeNode(node)
    }
  }
  prop(id, name, value) {
    var node = this.getNode(id)
    node.$props = node.$props || {}

    if (node.$props[name] !== value) { // cache
      node.$props[name] = value
      node[name] = value
    }
  }
  on(id, event, cb){}
  is(id, SubComponent) {
    var node = this.getNode(id)

    function create(SubComponent, node) {
      if (typeof SubComponent === 'function' && SubComponent.prototype.mount) {
        var component = new SubComponent()
        component.mount(node)
      }
    }

    if (node.$component && typeof SubComponent === 'function') {
      node.$component.render(node.$props)
      return
    }

    if (SubComponent && SubComponent.then) {
      SubComponent.then(SubComponent => create(SubComponent, node))
      return
    }

    create(SubComponent, node)

  }
  compile(tpl) {
    var self = this
    var code = '\n'
    var initCode = '\n'
    var scriptCode = '\n'
    var isGlobal = false
    var varNames = []

    // parse
    var node = tpl
    if ('string' === typeof tpl) {
      node = document.createElement('div')
      node.innerHTML = tpl
    }
    isGlobal = node == document.documentElement

    // <script>
    node.querySelectorAll('script').forEach(e=>scriptCode+=e.innerHTML)

    // <template name>
    node.querySelectorAll('template').forEach(node => {
      var name = getAttribute(node, 'name')
      if (name) {
        initCode += `
          var ${name} = this.constructor.prototype.${name}
          if(!${name}){
            var ${name} = this.defineSubComponent(${quot(node.innerHTML)})
            this.constructor.prototype.${name} = ${name}
          }
        `
      }
    })

    // varNames
    var varNames = getVarNames(`${initCode};${scriptCode}`)

    // loop
    loopTree(node)
    function loopTree(node) {
      var id = self.saveNode(node)
      // code += `// ${node.nodeValue||node.cloneNode().outerHTML}\n`

      // skip
      if (/^(skip|script|style|template)$/i.test(node.tagName)) return

      // {exp}
      if (node.nodeType === 3 && /\{[^]*?\}/.test(node.nodeValue)) {
        var exp = parseExp(node.nodeValue)
        code += `this_.prop('${id}', 'nodeValue', ${exp})\n`
        detectTemplateError(exp, node)
        return
      }

      // for
      var forAttr = getAttribute(node, 'for')
      var fm = getForMatch(forAttr)
      if (fm) {
        code += `this_['for']('${id}', ${fm.list}, function(${fm.item},${fm.key},${fm.index}){\n`
        detectTemplateError(forAttr.replace(/var|let|const/g, ';"#$&#";').replace(/of/, ';"#$&#";'), node)
        removeAttribute(node,  'for')
      }

      // if
      var ifAttr = getAttribute(node, 'if')
      if (ifAttr) {
        code += `this_['if']('${id}', ${ifAttr}, function(){\n`
        detectTemplateError(ifAttr, node)
        removeAttribute(node, 'if')
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
        // this.value=${attrValue}  <=>  oninput: ${attrValue}=this.value // TODO
        }

        // .attr :attr
        if (/^[\.:]/.test(attrName)) {
          var prop = attr2prop(node, attrName.substr(1))
          code += `this_.prop('${id}', '${prop}', ${attrValue})\n`

          detectTemplateError(attrValue, attribute)
          node.removeAttribute(attrName)
          return
        }

        // attr="{}"
        if (/\{[^]*?\}/.test(attrValue)) {
          var prop = attr2prop(node, attrName)
          var exp = parseExp(attrValue)
          code += `this_.prop('${id}', '${prop}', ${exp})\n`

          detectTemplateError(exp, attribute)
          node.removeAttribute(attrName)
          return
        }

        // on @
        if (/^(on|@)/.test(attrName)) {
          // TODO render
          // TODO 拦截异步函数 + 事件处理函数 + 恢复异步函数
          code += `this_.prop('${id}', "${attrName.replace('@', 'on')}", function(){${attrValue}; this_.render()})\n`

          detectTemplateError(attrValue, attribute)
          node.removeAttribute(attrName)
          return
        }

        // $="el"
        if (/^\$$/.test(attrName)) {
          code += `;${attrValue}=this_.getNode('${id}')\n`

          detectTemplateError(attrValue, attribute)
          node.removeAttribute('$')
        }

      })

      // is="SubCom"
      var isAttr = getAttribute(node, 'is')
      if (isAttr) {
        code += `this_.is('${id}', ${isAttr})\n`

        detectTemplateError(isAttr, node)
        node.removeAttribute('is')
      }
      // <SubCom />
      // TODO 如何区分是否自定义标签
      if (!isAttr && node.tagName && node.tagName.length>=2) {
        for (let varName of varNames) {
        // var SubCom, tagName SUBCOM
          if (/^[A-Z][a-z]/ && RegExp(`^${varName}$`, 'i').test(node.tagName)) {
            code += `this_.is('${id}', ${varName})\n`
            break
          }
        }
      }

      // >>>
      forEach(toArray(node.childNodes), childNode => loopTree(childNode))

      // end if
      if (ifAttr) {
        code += '})\n'
      }

      // end for
      if (forAttr) {
        code += '})\n'
      }

    }

    var getRender = Function('component_', `
      // debugger
      var this_ = this

      // initCode
      ${initCode}

      // <script>
      ${isGlobal ? '/* global */' : scriptCode}

      function render($props){
        // debugger

        // props
        $props = $props || {}
        ${getUpdatePropsCode(varNames, '$props')}

        // code  bind this
        ${code}
      }

      return render
    `)

    // render
    var render = getRender.call(this, this)
    this.render = render

    // this.el
    for (let childNode of node.children) {
      if (!/style|script/i.test(childNode.tagName)) {
        this.el = childNode
        break
      }
    }
  }
  defineSubComponent(tpl) {
    return class SubComponent extends Component{
      constructor() {
        super(tpl)
      }
    }
  }
  mount(target) {
    this.target = target // component => target
    target.$component = this // target => component

    if (target.parentNode) {
      this.render(target.$props) // first render
      target.parentNode.replaceChild(this.el, target)
    }
  }
}


// index.html
if (typeof window === 'object' && this === window) {
  var render = function(){}
  var __setInterval = window.setInterval
  window.setInterval = function(cb, time){
    return __setInterval(function(){
      var rs = cb.apply(this, arguments)
      render()
      return rs
    }, time)
  }
  var __setTimeout = window.setTimeout
  window.setTimeout = function(cb, time){
    return __setTimeout(function(){
      var rs = cb.apply(this, arguments)
      render()
      return rs
    }, time)
  }

  addEventListener('DOMContentLoaded', e => {
    var app = new Component(document.documentElement)
    window.app = app
    window.render = app.render
    app.render()

    render = function () {
      app.render()
    }
    window.setTimeout = __setTimeout
    window.setInterval = __setInterval
  })
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

// node -> -node
function removeNode(node) {
  if (!node.parentNode) return
  node.parentNode.removeChild(node)
}

// node, target -> <node><!-- target -->
function insertNode(node, target) {
  if (node.parentNode) return
  target.parentNode.insertBefore(node, target)
}

// node -> <node><!-- mark --> => mark
function markNode(node, name) {
  var prop = `__${name}Mark`
  if (node[prop]) return node[prop]

  var mark = document.createComment(` ${name}: ${node.cloneNode().outerHTML} ${node.__key === undefined ? '' : node.__key}`)
  // var mark = document.createTextNode('')
  node.parentNode.insertBefore(mark, node)

  node[prop] = mark
  mark.node = node

  return mark
}

// node, name => attrValue
function getAttribute(node, name) {
  return (node && node.getAttribute && node.getAttribute(name)) || ''
}

// node, name => --
function removeAttribute(node, name) {
  node && node.removeAttribute && node.removeAttribute(name)
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

// `(item,key,index) in list` => {list,item,key,index}
function getForMatch(code) {
  // for="item in list"
  // for="(item, i) in list"
  // for="(item, key, i) in list"
  // for="var key in list"
  // for="var item of list"
  var forMatch = /([^(,)\s]+)()()(?:\s+in\s+)([^(,)\s]+)/.exec(code) ||
      /\(\s*([^(,)\s]+)\s*,\s*([^(,)\s]+)()\s*\)(?:\s+in\s+)([^(,)\s]+)/.exec(code) ||
      /\(\s*([^(,)\s]+)\s*,\s*([^(,)\s]+)\s*,\s*([^(,)\s]+)\s*\)(?:\s+in\s+)([^(,)\s]+)/.exec(code) ||
      /(?:var|let|const)(?:\s+)()([^(,)\s]+)()(?:\s+in\s+)([^(,)\s]+)/.exec(code) ||
      /(?:var|let|const)(?:\s+)([^(,)\s]+)()()(?:\s+of\s+)([^(,)\s]+)/.exec(code)

  if (forMatch) {
    return {
      list: forMatch[4],
      item: forMatch[1] || '$item',
      key: forMatch[2] || '$key',
      index: forMatch[3] || '$index',
    }
  }
}

// code => error? throw 🐞
function detectTemplateError(code, node) {
  try {
    Function(code)
  } catch (error) {
    try {
      Function(`(${code})`) // (function(){})
    } catch (_) {
      var parentNode  = node.parentNode || node
      var tpl = node.nodeValue || node.cloneNode().outerHTML
      tpl = tpl.replace(/<\/.*?>/, '') // - </tag>
      tpl = parentNode.outerHTML.replace(tpl, '🐞' + tpl + '🐞')

      code = code.replace(/;"#(.*?)#";/g, '$1')
      throw Error(`[TemplateError] ${error}\n${code}\n^\n${tpl}\n`)
      // setTimeout(e => { throw Error('[TemplateError]\n  ' + errorTpl) })
    }
  }
}
