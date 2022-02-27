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
    this.node = null // firstElementChild
    this.target = null // <target is="Com">
    this['#tpl'] = tpl

    this.compile(tpl)
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

      // key: toString
      if (!hasOwnProperty(cloneNodes, key)) {
        cloneNode = undefined
      }

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
      if (!cloneNode['#isIfRemove#']) { // for(true)+if(false)
        self.if(cloneNode, true)
      }

      // >>>
      cb.call(self, item, key, index)
    })
    this.forPath = forPath // ***
    // insertNode(fragment, forMark)

    // -- remove
    each(cloneNodes, function(cloneNode, key) {
      if (!hasOwnProperty(list, key)) {
        // TODO setTimeout destroy?
        self.if(cloneNode, false)
      }
    })
  }
  if(id, bool, cb) {
    var node = this.getNode(id)
    node = node['@component']?.node || node // $is?

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
      node['#isIfRemove#'] = !!cb
    }

    var self = this
    return {
      elseif: function (id, bool2, cb) {
        if (!bool && bool2) {
          self.if(id, true)
          cb?.call(self)
          bool = true
        } else {
          self.if(id, false)
        }
        return this
      },
      else: function (id, cb) {
        if (bool) {
          self.if(id, false)
        } else {
          self.if(id, true)
          cb?.call(self)
        }
      },
    }
  }
  prop(id, name, value, isCallValue) {
    var node = this.getNode(id)
    var $props = node.$props = node.$props || {}
    var self = this

    // el.ref="el=this"
    if (isCallValue) {
      value = value.call(node)
    }

    // ...
    if (name == '..') {
      each(value, function (item, key) {
        self.prop(id, key, item)
      })
      return
    }

    // cache
    if ($props[name] === value && hasOwnProperty($props, name)) return // && {key: undefined}
    $props[name] = value // component.render(node.$props)

    // activeElement
    // if(value === node[name]) return
    if(value === node[name]) return

    // update dom
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
    var container = tpl
    var node = tpl
    if ('string' === typeof tpl) {
      container = document.createElement('div')
      container.innerHTML = tpl

      // node = firstElementChild
      for (let childNode of container.children) {
        if (!/style|script|template/i.test(childNode.tagName)) {
          node = childNode
          break
        }
      }
    }
    isGlobal = container == document.documentElement

    this.container = container
    this.node = node
    this.node['#component'] = this

    // <script>
    container.querySelectorAll('script').forEach(e=>scriptCode += '// <script>' + e.innerHTML + '// </script>\n')

    // <template name>
    container.querySelectorAll('template').forEach(node => {
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
    varNames = getVarNames(`${initCode};${scriptCode}`)
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
        code += `self.for('${id}', ${fm.list}, function(${fm.item},${fm.key},${fm.index}){\n`
        detectTemplateError(forAttr.replace(/^\((.+)\)$/, '$1').replace(/var|let|const/g, ';"$&";').replace(/of/, ';"$&";'), node)
        removeAttribute(node,  'for')
      }

      // if
      var ifAttr = getAttribute(node, 'if')
      var elseAttr = hasAttribute(node, 'else')
      if (ifAttr) {
        if (!elseAttr) {
          code += `self.if('${id}', ${ifAttr}, function(){\n`
        } else {
          code += `.elseif('${id}', ${ifAttr}, function(){\n`
          removeAttribute(node, 'else')
        }
        detectTemplateError(ifAttr, node)
        removeAttribute(node, 'if')
      } else if (elseAttr) {
        code += `.else('${id}', function(){\n`
        removeAttribute(node, 'else')
      }

      // [attr]
      forEach(toArray(node.attributes), function (attribute) {
        var attrName = attribute.nodeName
        var attrValue = attribute.nodeValue

        // on
        if (/^on/.test(attrName)) {
          code += `self.prop('${id}', "${attrName}", function(event){${attrValue}; self.render()})\n`

          detectTemplateError(attrValue, attribute)
          removeAttribute(node, attrName)
          return
        }

        // .on
        if (/^\.on/.test(attrName)) {
          attrValue = `function(){(${attrValue}).apply(this, arguments); self.render()}`
        }

        // .property
        if (/^\./.test(attrName)) {
          var propName = attr2prop(node, attrName.slice(1))
          code += `self.prop('${id}', '${propName}', function(){return ${attrValue}}, true)\n`

          detectTemplateError(attrValue, attribute)
          removeAttribute(node, attrName)
          return
        }
        // [property]
        if (/^\[.*\]$/.test(attrName)) {
          var propName = attr2prop(node, attrName.slice(1, -1))
          code += `self.prop('${id}', ${propName}, function(){return ${attrValue}}, true)\n`

          detectTemplateError(attrValue, attribute)
          removeAttribute(node, attrName)
          return
        }

        // class="c{bool}"
        if (/^class$/i.test(attrName)) {
          // "c{bool}" => "{bool?'c':''}"
          attrValue = attrValue.replace(/(\S+)\{(.*?)\}/g, '{$2?"$1":""}')
        }

        // @in @out => @originNode
        if (/^class$/i.test(attrName)) {
          node['@in'] = /([^'"\s]+)@in/.exec(attrValue)?.[1]
          node['@out'] = /([^'"\s]+)@out/.exec(attrValue)?.[1]
        }

        // attr="{}"
        if (/\{[^]*?\}/.test(attrValue)) {
          var propName = attr2prop(node, attrName)
          var exp = parseExp(attrValue)
          code += `self.prop('${id}', '${propName}', ${exp})\n`

          detectTemplateError(exp, attribute)
          removeAttribute(node, attrName)
          return
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
      if (ifAttr || elseAttr) {
        code += '})\n'
      }

      // end for
      if (fm) {
        code += '})\n'
      }

    }

    // Scope(){var data; return render(){ dom }}
    var Scope = Function(`
      var self = this
      // debugger
      // console.warn(this, render)

      // initCode
      ${initCode}

      // <script />
      ${isGlobal ? '/* global */' : injectRender(scriptCode, '!render.lock && Promise.resolve().then(self.render)')}

      // getter setter
      this.get = function(){
        this.get['_' + arguments[0]] = this.get['_' + arguments[0]]
          || eval('(function(){return '+arguments[0]+'})')

        return this.get['_' + arguments[0]]()
      }
      this.set = function(){
        this.set['_' + arguments[0]] = this.set['_' + arguments[0]]
          || eval('(function(){return '+arguments[0]+'='+arguments[1]+'})')

        return this.set['_' + arguments[0]](arguments[1])
      }

      // self.mount(target); self.render(target.$props)
      function render($props){
        // debugger
        // console.warn(this, render)

        // lock: render=>render
        // console.warn('render.lock:', render.lock)
        if(render.lock) return
        render.lock = true

        // props
        $props = $props || {}
        ${getUpdatePropsCode(varNames, '$props')}

        // code
        ${code}

        // -lock
        render.lock = false
      }

      return render
    `)

    // render
    var render = Scope.call(this, this)
    this.render = render
  }
  mount(target) {
    this.target = target // component => target
    this.render(target?.$props) // first render

    // replace
    if (target) {
      target['@component'] = this // target => component
      if (target.parentNode) {
        target.parentNode.replaceChild(this.node, target)
      }
    }
    // style -> head
    // TODO scoped
    var constructor = this.constructor
    if (!constructor['#styled']) {
      this.container.querySelectorAll('style').forEach(style => {
        document.head.appendChild(style)
      })
      constructor['#styled'] = true
    }
    Component['#ci'] = Component['#ci'] || 1
    constructor['#c'] = constructor['#c'] || (Component['#ci']++)
    this.node.setAttribute(`c${constructor['#c']}`, '')

    return this.node
  }
  defineSubComponent(tpl) {
    return Component.define(tpl)
  }
  static define(tpl) {
    return class SubComponent extends Component{
      constructor() {
        super(tpl)
      }
    }
  }
  static async load(url) {
    var tpl = await (await fetch(url)).text()
    tpl = tpl.replace(/require\(\s*['"](.*?)['"]\s*\)/g, function($, $1) {
      if (/\.html$/.test($1)) {
        var base = new URL(url, location).toString()
        var url2 = new URL($1, base).toString()
        return `this.constructor.load(${quot(url2)})`
      }
      return $
    })

    return Component.define(tpl)
  }
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
      if (hasOwnProperty(list, key)) {
        var item = list[key]
        cb(item, key, index++)
      }
    }
  }
}

// object, key => bool
function hasOwnProperty(object, key) {
  return Object.hasOwnProperty.call(object, key)
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

// node, name => bool
function hasAttribute(node, name) {
  return node?.hasAttribute?.(name) || false
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
      .replace(/\\/g, '\\\\') // \ => `\\`
      .replace(/['"]/g, '\\$&') // ' => `\'`  " => `\"`
      .replace(/\r/g, '\\r') // \r => `\\r`
      .replace(/\n/g, '\\n') // \n => `\\n`
  }${q}`
}

// `t {1} {2} t` => `"t " +(1)+ " " +(2)+ " t"`
function parseExp(text) {
  return text
    .replace(/(^|\})(((?!\$?\{|\})[^])*)(\$?\{|$)/g, '\v+ "\f$2\f" +\v')
    .slice(2, -2)
    .replace(/"\f([^]*?)\f"/g, function ($a, $1) {
      return quot($1)
    })
    .replace(/\v([^]*?)\v/g, 'self.output($1)')
}

// undefined => ''
// object => json
// array => json
function output(value) {
  if (value === undefined) {
    return ''
  }

  if (value?.constructor === Object || value instanceof Array) {
    try {
      return `\n${JSON.stringify(value, null, '  ')}\n`
    } catch (_) {
      return value
    }
  }

  return value
}

// for="(var key in list)"
// for="(var item of list)"
// for="(item, key, index) of list"
// => {list,item,key,index}
function getForAttrMatch(code) {
  // - ^( )$
  code = code.replace(/^\((.*)\)$/, '$1')

  var forMatch =
      // for...in
      /(var|let|const)(\s+)()(\S+)()(\s+in\s+)(.+)/.exec(code) ||
      // for...of
      /(var|let|const)(\s+)(\S+)()()(\s+of\s+)(.+)/.exec(code) ||
      //     (        item      ,    key         ,    index     )         in        list
      /()(?:\()?(\s*)(.+?)(?:\s*,\s*(.+?))?(?:\s*,\s*(.+?))?(?:\))?(\s+(?:in|of)\s+)(.+)/.exec(code)

  if (forMatch) {
    return {
      list: forMatch[7],
      item: forMatch[3] || '$item',
      key: forMatch[4] || '$key',
      index: forMatch[5] || '$index',
    }
  }
}

// `var x; let y /* var z */` => ['x', 'y']
function getVarNames(code) {
  code = code
    // - //...  /*...*/
    .replace(/\/\/.*|\/\*[^]*?\*\//g, '')
    // - '...'  "..."  `...`
    .replace(/'(\\.|.)*?'|"(\\.|.)*?"|`(\\.|[^])*?`/g, '')
    // - {...}
    .match(/(^|\})[^]*?(\{|$)/g).join('\n')

  var vars = []
  var reg = /\b(var|let|function)(\s+)([^\s=;,(]+)/g
  var m
  while (m = reg.exec(code)) {
    vars.push(m[3])
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

// fn(){code} => fn(){render(); code}
// TODO
// fixme if(){}
// fixme for(){}
// fixme width(){}
// fixme `width(){}`
function injectRender(code, render = 'self.render()') {
  const functionReg = /\)\s*\{|=>\s*\{/g // (){  =>{
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
      var parentNode  = node.parentNode || node.ownerElement?.parentNode || node
      var tpl = node.nodeValue || node.cloneNode().outerHTML
      tpl = tpl.replace(/<\/.*?>/, '') // - </tag>
      tpl = parentNode.outerHTML.replace(tpl, `🐞${tpl}🐞`)

      code = code.replace(/;"(.*?)";/g, '$1')
      var tplError = Error(`[TemplateError] ${error}\n${code}\n^\n${tpl}\n`)

      // throw tplError
      console.error(tplError)

      return true
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
    app.render()

    render = function () {
      app.render()
    }
    window.setTimeout = __setTimeout
    window.setInterval = __setInterval
  })
}

// export
if (typeof module === 'object') {
  module.exports = Component
}
