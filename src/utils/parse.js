// html => node
function parseHTML(html) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return wrapper
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
    .replace(/\v([^]*?)\v/g, 'self.exp($1)')
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
function parseFor(code) {
  if (!code) return

  // - ^( )$
  // !!! (item) in list()
  if (!/^\([^()]*?\)./.test(code)) {
    code = code.replace(/^\((.*)\)$/, '$1')
  }

  var forMatch =
      // for...in
      /(var|let|const)(\s+)()(.*?)()(\s+in\s+)(.+)/.exec(code) ||
      // for...of
      /(var|let|const)(\s+)(.*?)()()(\s+of\s+)(.+)/.exec(code) ||
      //     (        item      ,    key         ,    index     )         in        list
      /()(?:\()?(\s*)(.+?)(?:\s*,\s*(.+?))?(?:\s*,\s*(.+?))?(?:\))?(\s+(?:in|of)\s+)(.+)/.exec(code)

  if (forMatch) {
    return {
      raw: code,
      list: forMatch[7],
      item: forMatch[3] || '$item',
      key: forMatch[4] || '$key',
      index: forMatch[5] || '$index',
    }
  }
}

// `var x; let y /* var z */` => ['x', 'y']
function getVarNames(code) {
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

export {
  parseHTML,
  quot,
  parseExp,
  output,
  parseFor,
  getVarNames,
  getUpdatePropsCode,
  detectTemplateError,
}
