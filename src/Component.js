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
      // id: node,
      length: 0,
    }
    this.forPath = '' // ***
    this.el = null // firstElementChild
    this.target = null // <target is="Com">
    this['#tpl'] = tpl

    this.compile(tpl)

    console.log(this.render)
  }
  saveNode(node) {
    var nodeString = node.nodeValue || node.cloneNode().outerHTML
    if (node.nodeType === 2) {
      nodeString = `[${node.nodeName}=${node.nodeValue}]`
    }

    var id = node['@id'] || `${this.nodeMap.length++}: ${nodeString} `
      .replace(/\s+/g, ' ')
      .replace(/'/g, '"')
      .replace(/\\/g, '')

    this.nodeMap[id] = node
    node['@id'] = id
    return id
  }
  getNode(id) {
    if (id?.nodeType) { // node
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
    var self = this
    var node = this.getNode(id)
    var forMark = markNode(node, '#for#')
    removeNode(node)
    var cloneNodes = node['@cloneNodes'] = node['@cloneNodes'] || {}
    // var fragment = document.createDocumentFragment() // ??

    var forPath = this.forPath
    each(list, function(item, key, index) {
      self.forPath = `${forPath}#${key}` // ***
      var cloneNode = cloneNodes[key]

      // ++ clone
      if (!cloneNode) {
        cloneNode = node.cloneNode(true)
        cloneNode['#for#'] = forMark
        cloneNode['@key'] = key
        cloneNodes[key] = cloneNode

        // originNodeId + forPath => cloneNode
        saveCloneNode(cloneNode, node)
        function saveCloneNode(cloneNode, node) {
          cloneNode['@originNode'] = node['@originNode'] || node
          var originNodeId = cloneNode['@originNode']['@id']
          cloneNode['@id'] = `${originNodeId}${self.forPath}` // ***
          self.saveNode(cloneNode)

          forEach(cloneNode.childNodes, (e,i)=> saveCloneNode(e,node.childNodes[i]))
        }

        // insertNode(cloneNode, forMark)
        // fragment.appendChild(cloneNode)
      }
      // ++ insert
      self.if(cloneNode, true)

      // >>>
      cb.call(self, item, key, index)
    })
    this.forPath = forPath // ***
    // insertNode(fragment, forMark)

    // -- remove
    each(cloneNodes, function(cloneNode, key) {
      if (!Object.hasOwnProperty.call(list, key)) {
        // TODO setTimeout destroy?
        self.if(cloneNode, false)
      }
    })
  }
  if(id, bool, cb) {
    var node = this.getNode(id)
    node = node['@component']?.el || node // $is?

    var target = node['#if#'] || node['#for#'] // for+if?

    if (bool) {
      // insertNode(node, target)
      var inClassName = node['@originNode']?.['@in'] || node['@in']
      animateInsertNode(node, target, inClassName)
      cb && cb.call(this)
    } else {
      markNode(node, '#if#')
      // removeNode(node)
      var outClassName = node['@originNode']?.['@out'] || node['@out']
      animateRemoveNode(node, outClassName)
    }
  }
  prop(id, name, value) {
    var node = this.getNode(id)
    node.$props = node.$props || {}

    // cache
    if (node.$props[name] === value) return

    node.$props[name] = value // component.render(node.$props)
    node[name] = value // node.prop
  }
  output(value) {
    return output(value)
  }
  on(id, event, cb){}
  is(id, SubComponent) {
    var node = this.getNode(id)

    function _is(node, SubComponent) {
      if (SubComponent.prototype instanceof Component) {
        // render
        if (node['@component']) {
          node['@component'].render(node.$props)
        }
        // or new
        else {
          var component = new SubComponent()
          component.mount(node)
        }
      }
    }

    if (SubComponent?.then) {
      SubComponent.then(SubComponent => _is(node, SubComponent))
    } else {
      _is(node, SubComponent)
    }

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
    node.querySelectorAll('script').forEach(e=>scriptCode += e.innerHTML)

    // <template name>
    node.querySelectorAll('template').forEach(node => {
      var name = getAttribute(node, 'name')
      if (name) {
        initCode += `
          var ${name} = this.constructor.prototype.${name}
          if(!${name}){
            ${name} = this.defineSubComponent(${quot(node.innerHTML)})
            this.constructor.prototype.${name} = ${name}
          }
        `
      }
    })

    // varNames
    var varNames = getVarNames(`${initCode};${scriptCode}`)
    self['#varNames'] = varNames

    // loop
    loopTree(node)
    function loopTree(node) {
      var id = self.saveNode(node)
      code += `// ${id}\n`

      // skip
      if (/^(skip|script|style|template)$/i.test(node.tagName)) return

      // {exp}
      if (node.nodeType === 3 && /\{[^]*?\}/.test(node.nodeValue)) {
        var exp = parseExp(node.nodeValue)
        code += `self.prop('${id}', 'nodeValue', ${exp})\n`
        detectTemplateError(exp, node)
        return
      }

      // for > if > .prop > is >>> childNodes <<< end if < end for

      // for
      var forAttr = getAttribute(node, 'for')
      var fm = getForAttrMatch(forAttr)
      if (fm) {
        code += `self['for']('${id}', ${fm.list}, function(${fm.item},${fm.key},${fm.index}){\n`
        detectTemplateError(forAttr.replace(/var|let|const/g, ';"#$&#";').replace(/of/, ';"#$&#";'), node)
        removeAttribute(node,  'for')
      }

      // if
      var ifAttr = getAttribute(node, 'if')
      if (ifAttr) {
        code += `self['if']('${id}', ${ifAttr}, function(){\n`
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

        // @in @out => @originNode
        if (/^class$/i.test(attrName)) {
          node['@in'] = /([^'"\s]+)@in/.exec(attrValue)?.[1]
          node['@out'] = /([^'"\s]+)@out/.exec(attrValue)?.[1]
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
          code += `self.prop('${id}', '${prop}', ${attrValue})\n`

          detectTemplateError(attrValue, attribute)
          removeAttribute(node, attrName)
          return
        }

        // attr="{}"
        if (/\{[^]*?\}/.test(attrValue)) {
          var prop = attr2prop(node, attrName)
          var exp = parseExp(attrValue)
          code += `self.prop('${id}', '${prop}', ${exp})\n`

          detectTemplateError(exp, attribute)
          removeAttribute(node, attrName)
          return
        }

        // on @
        if (/^(on|@)/.test(attrName)) {
          // TODO injectAsyncFunctions
          code += `self.prop('${id}', "${attrName.replace('@', 'on')}", function(){${attrValue}; self.render()})\n`

          detectTemplateError(attrValue, attribute)
          removeAttribute(node, attrName)
          return
        }

        // $="el"
        if (/^\$$/.test(attrName)) {
          code += `;${attrValue}=self.getNode('${id}')\n`

          detectTemplateError(attrValue, attribute)
          removeAttribute(node, '$')
        }

      })

      // is="SubCom"
      var isAttr = getAttribute(node, 'is')
      if (isAttr) {
        code += `self.is('${id}', ${isAttr})\n`

        detectTemplateError(isAttr, node)
        removeAttribute(node, 'is')
      }
      // <SubCom />
      else {
        for (let varName of varNames) {
          // var SubCom, html: SubCom, tagName: SUBCOM, localName: subcom
          if (/^[A-Z]/.test(varName) && RegExp(`^${varName}$`, 'i').test(node.tagName)) {
            code += `self.is('${id}', ${varName})\n`
            break
          }
        }
      }

      // >>>
      forEach(toArray(node.childNodes), childNode => loopTree(childNode))
      // <<<

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
      var self = this

      // initCode
      ${initCode}

      // <script>
      ${isGlobal ? '/* global */' : injectRender(scriptCode, 'Promise.resolve().then(self.render)')}

      // self.mount(target); self.render(target.$props)
      function render($props){
        // debugger

        // props
        $props = $props || {}
        ${getUpdatePropsCode(varNames, '$props')}

        // code
        ${code}
      }

      function get(name){
        get[name] = get[name] || eval('(function(){return '+name+'})')
        return get[name]()
      }
      function set(name, value){
        set[name] = set[name] || eval('(function(){return '+name+'='+value+'})')
        return set[name](value)
      }
      this.get = get
      this.set = set

      return render
    `)

    // render
    var render = getRender.call(this, this)
    this.render = render

    // this.el = firstElementChild(!style,!script)
    this.el = null
    for (let childNode of node.children) {
      if (!/style|script/i.test(childNode.tagName)) {
        this.el = childNode
        break
      }
    }
    this['#node'] = node
    this.el['#component'] = this
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
    this.render(target?.$props) // first render

    // replace
    if (target) {
      target['@component'] = this // target => component
      if (target.parentNode) {
        target.parentNode.replaceChild(this.el, target)
      }
    }
    // style
    // TODO scoped
    var constructor = this.constructor
    if (!constructor['#styled']) {
      this['#node'].querySelectorAll('style').forEach(style => {
        document.head.appendChild(style)
      })
      constructor['#styled'] = true
    }
    Component['#ci'] = Component['#ci'] || 1
    constructor['#c'] = constructor['#c'] || (Component['#ci']++)
    this.el.setAttribute(`c${constructor['#c']}`, '')

    return this.el
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

  var __requestAnimationFrame = window.requestAnimationFrame
  window.requestAnimationFrame = function(cb, time){
    return __requestAnimationFrame(function(){
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

// node, target -> <node><!-- target -->
function insertNode(node, target) {
  if (node.parentNode) return
  target.parentNode?.insertBefore(node, target)
}

// node -> --
function removeNode(node) {
  node.parentNode?.removeChild(node)
}

// animate -> cb()
function animateNode(node, className = 'fadeIn', cb) {
  node['#animateCancel']?.() // cancel last

  addClass(node, className)
  var animationDuration = computeStyle(node, 'animationDuration', parseFloat)

  if (animationDuration) {
    var off = on(node, 'animationend', finish)
    var timer = setTimeout(finish, animationDuration * 1000) // !parentNode
  } else {
    finish()
  }

  function cancel() {
    delete node['#animateCancel']
    removeClass(node, className)
    off?.()
    clearTimeout(timer)
  }
  function finish() {
    cb?.()
    cancel()
  }

  node['#animateCancel'] = cancel
  return cancel
}

// animate + node
function animateInsertNode(node, target, className) {
  if (node['#animateRemoved'] || !node.parentNode) {
    node['#animateRemoved'] = false

    insertNode(node, target)
    animateNode(node, className, function() {
    })
  }
}

// animate - node
function animateRemoveNode(node, className) {
  if (!node['#animateRemoved']) {
    node['#animateRemoved'] = true

    animateNode(node, className, function() {
      removeNode(node)
    })
  }
}

// node -> <node><!-- mark --> => [get||create](mark)
function markNode(node, name) {
  var prop = `${name}`
  if (node[prop]) return node[prop]

  var text = ` ${name}: ${node.cloneNode().outerHTML} ${node['@key'] ?? '' }`
  var mark = document.createComment(text)
  // var mark = document.createTextNode('')
  node.parentNode.insertBefore(mark, node)

  node[prop] = mark
  mark['#node'] = node

  return mark
}

// node, name => attrValue
function getAttribute(node, name) {
  return node?.getAttribute?.(name) || ''
}

// attrName => --
function removeAttribute(node, name) {
  node?.removeAttribute?.(name)
}

// => computedStyle[name]
function computeStyle(node, name, Type = String) {
  // TODO prefix: webkit, moz, ms
  return Type(getComputedStyle(node)[name])
}

// + .class
function addClass(node, name) {
  node.classList.add(name)
}

// - .class
function removeClass(node, name) {
  node.classList.remove(name)
}

// + addEventListener => cancel()
function on(node, name, cb) {
  // TODO prefix
  node.addEventListener(name, cb)
  return function () {
    node.removeEventListener(name, cb)
  }
}

// 'innerhtml' => 'innerHTML'
function attr2prop(node, attr) {
  var prop = attr2prop[`prop:${attr}`] // cache
  if(prop) return prop

  for (prop in node) {
    if (prop.toLowerCase() === attr) {
      attr2prop[`prop:${attr}`] = prop
      return prop
    }
  }

  prop = {
    class: 'className',
  }[attr] || attr

  return prop
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
// TODO <b>{ e=> {{}} }</b>
function parseExp(text, left = '{', right = '}') {
  const allChar = '[^]'
  const stringContent = `(?:\\.|${allChar})*?`
  const string = `"${stringContent}"|'${stringContent}'|\`${stringContent}\``
  const brace = `\\{${allChar}*?\\}`
  const expReg = RegExp(`(\\${left})((?:${string}|${brace}|${allChar})*?)(\\${right})`, 'g')

  return (
    text
      // {exp} {`${e}{}\``}
      .replace(expReg, '\f +self.output($2)+ \f')
      // }text{
      .replace(
        RegExp('(^|\f)([^]*?)(\f|$)', 'g'),
        function ($a, $1, $2, $3) {
          return quot($2)
        },
      )
  )
}

// undefined => ''
// object => json
function output(value) {
  if (typeof value === 'undefined') {
    return ''
  }

  if (typeof value === 'object') {
    try {
      return `\n${JSON.stringify(value, null, '  ')}\n`
    } catch (_) {
      return value
    }
  }

  return value
}

// `(item,key,index) in list` => {list,item,key,index}
function getForAttrMatch(code) {
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

// `var x; let y /* var z */` => ['x', 'y']
function getVarNames(code, cb) {
  code = code.replace(/\/\/.*|\/\*[^]*?\*\//g, '') // - //  /**/
  var vars = []
  var reg = /(var|let|const)(\s+)(.*?)(\s|=|,|;|$)/g
  var m
  while (m = reg.exec(code)) {
    var n = m[3]
    vars.push(n)
    cb?.(n)
  }
  return vars
}

// var propName == props.propname
// ["propName"] => `"propname" in props && (propName=props.propname)`
function getUpdatePropsCode(vars, propsName = 'props') {
  var string = '\n'
  vars.forEach(function (varName) {
    var propname = varName.toLowerCase()
    string += `"${propname}" in ${propsName} && (${varName}=${propsName}.${propname})\n`
  })
  return string
}

function injectRender(code, render = 'self.render()') {
  const functionReg = /\)\s*\{|=>\s*\{/g // (){self.render(); }  =>{self.render(); }
  return code.replace(functionReg, `$& ${render}; `)
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
