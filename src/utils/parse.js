// html => node
function parseHTML(html, containerTagName = 'div') {
  const container = document.createElement(containerTagName)
  container.innerHTML = html
  return container
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
    /()(?:\()?(\s*)(.+?)(?:\s*,\s*(.+?))?(?:\s*,\s*(.+?))?(?:\))?(\s+(?:in|of)\s+)(.+)/.exec(
      code
    )

  if (forMatch) {
    return {
      code,
      list: forMatch[7],
      item: forMatch[3] || '$item',
      key: forMatch[4] || '$key',
      index: forMatch[5] || '$index',
    }
  }
}

// `var x; let y /* var z */` => ['x', 'y']
function parseVars(code) {
  var vars = []
  var reg = /\b(var|let|function)(\s+)([^\s=;,(]+)/g
  var m
  while ((m = reg.exec(code))) {
    vars.push(m[3])
  }
  return vars
}

// 'innerhtml' => 'innerHTML'
function attr2prop(node, attr) {
  var prop = attr2prop[`prop:${attr}`] // cache
  if (prop) return prop

  for (prop in node) {
    if (prop.toLowerCase() === attr) {
      attr2prop[`prop:${attr}`] = prop
      return prop
    }
  }

  prop =
    {
      class: 'className',
    }[attr] || attr

  return prop
}

// code => error? throw 🐞
function detectError(code, raw, tpl) {
  try {
    Function(code)
  } catch (error) {
    try {
      Function(`(${code})`) // (function(){})
    } catch (_) {
      // line
      let line = tpl.match(
        RegExp(`.*${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`)
      )?.[0]

      // 🐞
      line = line.replace(raw, `🐞${raw}🐞`)
      tpl = tpl.replace(raw, `🐞${raw}🐞`)

      // error
      var tplError = Error(`[TemplateError] ${error}
${code}
^
---------------------------------
${line}
---------------------------------
${tpl}
`)

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
  parseFor,
  parseVars,
  attr2prop,
  detectError,
}
