import {
  parseExp,
  parseFor,
  parseVars,
  createUpdatePropsCode,
  attr2prop,
  detectError,
} from './parse.js'

const ID_KEY = 'id' // <el ID="n#oid" />  <text ID="n-">${value}</text>

/**
 * ${1}
 * <ul title="${2}" .prop="2" [key]="2">
 *   <li for="const item of list3" if="item!=3" .value="3" new="MyComponent">
 *     ${4}
 *   </li>
 * </ul>
 * ==>
 * <text ID=1#>${1}</text>
 * <ul ID=2>
 *   <li ID=3>
 *     <text ID=4#>${4}</text>
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
 *     self.new(3, MyComponent)
 *
 *     self.text(4, `${4}`)
 *   })
 * })
 * @param {Element} node
 */
function compile(node) {
  const html = node.outerHTML
  let i = 0
  let scriptCode = '' // <script>...</script>
  let code = '' // render

  // <script>
  Array(...node.getElementsByTagName('script')).forEach(
    (e) => (scriptCode += e.innerHTML + '\n')
  )
  var vars = parseVars(scriptCode).sort() // Com > com

  // loop
  loopNodeTree(node)
  /**
   * @param {Element|Node|Node[]} node
   */
  function loopNodeTree(node) {
    // node || [node]
    if (node instanceof Array) {
      node.forEach(loopNodeTree)
      return
    }

    // <el ID>: lazy + cache
    const id = {
      toString() {
        ++i

        // <el> => <el ID>
        if (node.nodeType === 1) {
          const oid = node.getAttribute(ID_KEY) || ''
          node.setAttribute(ID_KEY, !oid ? i : `${i}${oid}`)
        }
        // ${exp} => <text ID>${exp}</text>
        else if (node.nodeType === 3) {
          const text = document.createElement('text')
          text.setAttribute(ID_KEY, `${i}-`)
          node.parentNode.insertBefore(text, node)
          text.appendChild(node)
        }

        this.toString = function () {
          return i
        }
        return i
      },
    }
    // oid
    const oid = node.getAttribute?.('id')
    if (oid) node.setAttribute('id', `#${oid}`)

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
        code += `self.text('${id}', ${exp})\n`
        detectError(exp, node.nodeValue, html)
      }
      return
    }

    // for > if > .prop > new >>> childNodes <<< /if < /for

    // for
    const _for_ = parseFor(node.getAttribute('for'))
    if (_for_) {
      code += `self.for('${id}', (${_for_.list}), function(${_for_.item},${_for_.key},${_for_.index}){\n`
      detectError(
        _for_.code.replace(/\b(var|let|const|of)\b/g, ';"$&";'),
        _for_.code,
        html
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
      detectError(_if_, _if_, html)
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

        detectError(onCode, attrValue, html)
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
          detectError(propName, attrName, html)
        }
        code += `self.prop('${id}', ${propName}, function(){return ${attrValue}})\n`

        detectError(attrValue, attrValue, html)
        node.removeAttribute(attrName)
        return
      }

      // attr="${}"
      if (/\$?\{[^]*?\}/.test(attrValue)) {
        const exp = parseExp(attrValue)
        code += `self.attr('${id}', '${attrName}', function(){return ${exp}})\n`
        detectError(exp, attrValue, html)
      }
    })

    // new
    const _new_ = node.getAttribute('new')
    const _mode_ = node.getAttribute('mode')
    let _Class_ = _new_
    if (!_new_) {
      for (const _var_ of ['this.constructor', 'self.constructor', ...vars]) {
        if (RegExp(`^${node.tagName}$`, 'i').test(_var_)) {
          _Class_ = _var_
          break
        }
      }
    }
    if (_Class_) {
      code += `self.new('${id}', typeof ${_Class_} !== 'undefined' && ${_Class_}, '${_mode_}')\n`
      detectError(_Class_, _Class_, html)
      node.removeAttribute('new')
      node.removeAttribute('mode')
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
    scriptCode,
    vars,
    updatePropsCode: createUpdatePropsCode(vars),
    code,
  }
}

/**
 * <text ID>text</text> => text
 * <el ID /> => <el />
 * node['#id'] = ID
 *
 * @param {Element|DocumentFragment} root compiledTpl
 * @returns {Object}
 */
function getNodeMap(root) {
  const nodeMap = {}

  loop(root)
  function loop(node) {
    const idx = node.getAttribute?.(ID_KEY)
    // n  n-  n#oid
    if (idx) {
      // <text ID="n-">text</text> => text
      if (/-$/.test(idx)) {
        const id = idx.replace('-', '')
        const text = node.firstChild
        nodeMap[id] = text
        text['#id'] = id
        node.parentNode.replaceChild(text, node)
      }
      // <el ID /> => <el />
      else {
        const [id, old] = idx.split('#')
        if (id) {
          nodeMap[id] = node
          node['#id'] = id
        }
        if (old) node.setAttribute(ID_KEY, old)
        else node.removeAttribute(ID_KEY)
      }
    }
    Array(...node.children).forEach(loop)
  }

  return nodeMap
}

/**
 * <el ID> => cloneNode[ID]=`${ID}${forKey}`
 * self.$(ID) + forKey => el[`#<clone>${ID}${forKey}`] => cloneNode
 *
 * @param {Node} node
 * @param {string} forKey
 * @returns {Node} cloneNode
 */
function cloneWithId(node, forKey) {
  return cloneNodeDeep(node, function (node, cloneNode) {
    const origin = node['#for<origin>'] || node // !! for+for
    const originId = origin['#id']

    if (originId) {
      cloneNode['#for<origin>'] = origin
      cloneNode['#id'] = `${originId}${forKey}`
      // self.$(id) => origin + forKey => cloneNode
      origin[`#<clone>${originId}${forKey}`] = cloneNode
    }
  })
}

/**
 *
 * @param {Node} node
 * @param {function} cb
 * @returns {Node} cloneNode
 */
function cloneNodeDeep(node, cb) {
  const cloneNode = node.cloneNode(true)

  loop(node, cloneNode)
  function loop(node, cloneNode) {
    cb(node, cloneNode)

    Array(...node.childNodes).forEach(function (child, index) {
      loop(child, cloneNode.childNodes[index])
    })
  }

  return cloneNode
}

export { compile as default, compile, getNodeMap, cloneWithId, cloneNodeDeep }
