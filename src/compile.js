import {
  parseHTML,
  parseExp,
  parseFor,
  parseVars,
  attr2prop,
  detectError,
} from './utils/parse.js'

const ID_KEY = '_' // <el ID>
const BACKUP_ID_PREFIX = '_backup_' // _backup_ID
const TEXT_PLACE_TAG = 't_' // text => <_ ID>text</_>

/**
 * ${1}
 * <ul title="${2}" .prop="2" [key]="2">
 *   <li for="const item of list3" if="item!=3" .value="3" is="MyComponent">
 *     ${4}
 *   </li>
 * </ul>
 * ==>
 * <_ ID=1>${1}</_>
 * <ul ID=2>
 *   <li ID=3>
 *     <_ ID=4>${4}</_>
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
  let _id = 0
  let scriptCode = '' // <script>...</script>
  let code = '' // render

  // parse
  const wrapper = tpl.nodeType ? tpl : parseHTML(tpl)

  // <script>
  Array(...wrapper.getElementsByTagName('script')).forEach(
    (e) => (scriptCode += '// <script>' + e.innerHTML + '// </script>\n'),
  )
  var vars = parseVars(scriptCode).sort() // Com > com

  // loop
  loopNodeTree(wrapper)
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
        this.toString = function () {
          return _id
        }
        ++_id

        // <el /> => <el ID />
        if (node.nodeType === 1) {
          const oldId = node.getAttribute(ID_KEY)
          if (oldId) node.setAttribute(BACKUP_ID_PREFIX + ID_KEY, oldId)
          node.setAttribute(ID_KEY, _id)
        }
        // ${exp} => <text ID>${exp}</text>
        else if (node.nodeType === 3) {
          const text = document.createElement(TEXT_PLACE_TAG)
          text.setAttribute(ID_KEY, _id)
          node.parentNode.insertBefore(text, node)
          text.appendChild(node)
        }

        return _id
      },
    }

    // /* <node /> */
    const nodeString = (node.nodeValue || node.cloneNode().outerHTML)
      .replace(/\s+/g, ' ')
      .replace(/<\/[^<]*?>$/, '')
      .replace(/\*\//g, '*\u200B/')
    if (nodeString.match(/\S/)) {
      code += `\n/* ${nodeString} */\n`
    }

    // skip
    if (/^(skip|script|style|template)$/i.test(node.tagName)) return
    if (node.nodeType !== 1 && node.nodeType !== 3) return

    // text: ${}
    if (node.nodeType === 3) {
      if (/\$?\{[^]*?\}/.test(node.nodeValue)) {
        // ${exp}
        const exp = parseExp(node.nodeValue)
        code += `self.text('${id}', ${exp})\n`
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
        tpl,
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
        code += `self.attr('${id}', '${attrName}', ${exp})\n`
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
    wrapper,
    scriptCode,
    code,
  }
}

/**
 * only once per id
 * @param {Element} root
 * @param {string|number} id
 * @returns {Element|Text}
 */
function queryNode(root, id) {
  const el = queryNodeByAttr(root, ID_KEY, id)
  if (!el) {
    console.error('queryNode:', `!${id}`)
    return
  }

  // <_ ID>text</_>  ->  text
  if (el.tagName.toLowerCase() == TEXT_PLACE_TAG) {
    const text = el.firstChild
    el.parentNode.replaceChild(el.firstChild, el)
    return text
  }

  // <el ID>  ->  <el>
  el.removeAttribute(ID_KEY)
  const oid = el.getAttribute(BACKUP_ID_PREFIX + ID_KEY)
  if (oid) {
    el.setAttribute(ID_KEY, oid)
  }

  return el
}

/**
 * @param {Element} root
 * @param {string} attr
 * @param {string|number} value
 * @returns {Element|Text}
 */
function queryNodeByAttr(root, attr, value) {
  return root.querySelector(`[${attr}="${value}"]`)
}

export { compile as default, compile, queryNode }
