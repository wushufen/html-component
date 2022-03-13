import {
  parseHTML,
  parseExp,
  parseFor,
  parseVars,
  attr2prop,
  detectError,
} from './utils/parse.js'

const ID_KEY = 'id_' // <el ID>
const BACKUP_ID_PREFIX = '_backup_' // _backup_ID

/**
 * ${1}
 * <ul title="${2}" .prop="2" [key]="2">
 *   <li for="const item of list3" if="item!=3" .value="3" is="MyComponent">
 *     ${4}
 *   </li>
 * </ul>
 * ==>
 * <text ID=1>${1}</text>
 * <ul ID=2>
 *   <li ID=3>
 *     <text ID=4>${4}</text>
 *   </li>
 * </ul>
 * ==>
 * self.text(1, `${1}`)
 *
 * self.attr(2, 'title', `${2}`)
 * self.prop(2, 'prop', 2)
 * self.prop(2, key, 2)
 *
 * self.for(3, list3, function(item, $key, $index){
 *   self.if(item!=3, function() {
 *     self.prop(3, 'value', 3)
 *     self.is(3, MyComponent)
 *
 *     self.text(4, `${4}`)
 *   })
 * })
 * @param {string|Element} tpl
 */
function compile(tpl) {
  let i = 0
  let scriptCode = '' // <script>...</script>
  let code = '' // render

  // parse
  const container = tpl.nodeType ? tpl : parseHTML(tpl)

  // <script>
  scriptCode += '// <script>\n'
  Array(...container.getElementsByTagName('script')).forEach(
    (e) => (scriptCode += e.innerHTML + '\n')
  )
  scriptCode += '// </script>\n'
  var vars = parseVars(scriptCode).sort() // Com > com

  // loop
  loopNodeTree(container)
  /**
   * @param {Element|Node|Node[]} node
   */
  function loopNodeTree(node) {
    // node || [node]
    if (node instanceof Array) {
      node.forEach(loopNodeTree)
      return
    }

    // id: lazy + cache
    const id = {
      toString() {
        ++i

        // <el /> => <el ID />
        if (node.nodeType === 1) {
          const oldId = node.getAttribute(ID_KEY)
          if (oldId) node.setAttribute(BACKUP_ID_PREFIX + ID_KEY, oldId)
          node.setAttribute(ID_KEY, i)
        }
        // ${exp} => <text ID>${exp}</text>
        else if (node.nodeType === 3) {
          const text = document.createElement('text')
          text.setAttribute(ID_KEY, `${i}#`)
          node.parentNode.insertBefore(text, node)
          text.appendChild(node)
        }

        this.toString = function () {
          return i
        }
        return i
      },
    }

    // /* <node /> */
    const nodeString = (node.nodeValue || node.cloneNode().outerHTML)
      .replace(/\s+/g, ' ')
      .replace(/<\/[^<]*?>$/, '')
    if (nodeString.match(/\S/)) {
      code += `\n// ${nodeString}\n`
    }

    // skip
    if (node.nodeType !== 1 && node.nodeType !== 3) return
    if (/^(skip|script|style|template)$/i.test(node.tagName)) return

    // text: ${}
    if (node.nodeType === 3) {
      if (/\$?\{[^]*?\}/.test(node.nodeValue)) {
        // ${exp}
        const exp = parseExp(node.nodeValue)
        code += `self.text('${id}#', ${exp})\n`
        detectError(exp, node.nodeValue, tpl)
      }
      return
    }

    // for > if > .prop > is >>> childNodes <<< /if < /for

    // for
    const _for_ = parseFor(node.getAttribute('for'))
    if (_for_) {
      code += `self.for('${id}', (${_for_.list}), function(${_for_.item},${_for_.key},${_for_.index}){\n`
      detectError(
        _for_.code.replace(/\b(var|let|const|of)\b/g, ';"$&";'),
        _for_.code,
        tpl
      )
      node.removeAttribute('for')
    }

    // if
    const _if_ = node.getAttribute('if')
    const _else_ = node.hasAttribute('else')
    if (_if_) {
      if (!_else_) {
        code += `self.if('${id}', (${_if_}), function(){\n`
      } else {
        code += `.elseif('${id}', (${_if_}), function(){\n`
        node.removeAttribute('else')
      }
      detectError(_if_, _if_, tpl)
      node.removeAttribute('if')
    } else if (_else_) {
      code += `.else('${id}', function(){\n`
      node.removeAttribute('else')
    }

    // [attr]
    Array(...node.attributes).forEach((attribute) => {
      const attrName = attribute.nodeName
      const attrValue = attribute.nodeValue

      // on .on
      if (/^\.?on/.test(attrName)) {
        let onType = attrName
        let onCode = attrValue
        if (/^\./.test(attrName)) {
          onType = attrName.slice(1)
          onCode = `(${attrValue}).apply(this, arguments)`
        }
        code += `self.on('${id}', "${onType}", function(event){
          ${onCode}; self.render()
        })\n`

        detectError(onCode, attrValue, tpl)
        node.removeAttribute(attrName)
        return
      }

      // .property [property]
      if (/^\.|^\[.*\]$/.test(attrName)) {
        let propname = attrName.replace(/^\.|^\[|\]$/g, '')
        let propName = attr2prop(node, propname)
        // .
        if (/^\./.test(attrName)) {
          propName = `'${propName}'`
        }
        // []
        else {
          detectError(propName, attrName, tpl)
        }
        code += `self.prop('${id}', ${propName}, function(){return ${attrValue}})\n`

        detectError(attrValue, attrValue, tpl)
        node.removeAttribute(attrName)
        return
      }

      // attr="${}"
      if (/\$?\{[^]*?\}/.test(attrValue)) {
        const exp = parseExp(attrValue)
        code += `self.attr('${id}', '${attrName}', function(){return ${exp}})\n`
        detectError(exp, attrValue, tpl)
      }
    })

    // is
    var _is_ = node.getAttribute('is')
    if (_is_) {
      code += `self.is('${id}', ${_is_})\n`

      detectError(_is_, _is_, tpl)
      node.removeAttribute('is')
    } else {
      for (const _var_ of vars) {
        if (RegExp(`^${node.tagName}$`, 'i').test(_var_)) {
          code += `self.is('${id}', typeof ${_var_} !== 'undefined' && ${_var_})\n`
          break
        }
      }
    }

    // >>>
    loopNodeTree([...node.childNodes])
    // <<<

    // end if
    if (_if_ || _else_) {
      code += '})\n'
    }

    // end for
    if (_for_) {
      code += '})\n'
    }
  }

  return {
    container,
    scriptCode,
    code,
  }
}

/**
 *
 * @param {Element} root
 * @returns {Object}
 */
function getNodeMap(root) {
  const nodeMap = {}

  loop(root)
  function loop(node) {
    const id = node.getAttribute?.(ID_KEY)
    if (id) {
      // <text ID>text</text> => text
      if (/#/.test(id)) {
        nodeMap[id] = node.firstChild
        node.parentNode.replaceChild(node.firstChild, node)
      } else {
        nodeMap[id] = node
        node.removeAttribute(ID_KEY)
        const oid = node.getAttribute(BACKUP_ID_PREFIX + ID_KEY)
        if (oid) node.setAttribute(ID_KEY, oid)
      }
    }
    Array(...node.children).forEach(loop)
  }

  return nodeMap
}

export { compile as default, compile, getNodeMap }
