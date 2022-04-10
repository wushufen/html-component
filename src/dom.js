/**
 *
 * @param {Node[]} nodes
 * @returns {DocumentFragment}
 */
function Fragment(nodes = []) {
  const fragment = document.createDocumentFragment()
  nodes.forEach((node) => append(fragment, node))
  return fragment
}

/**
 *
 * @param {Node} node
 * @param {Node} target
 */
function insertBefore(node, target) {
  if (node === target.previousSibling) {
    return
  }
  target.parentNode.insertBefore(node, target)
}

/**
 *
 * @param {Node} node
 * @param {Node} target
 */
function insertAfter(node, target) {
  const next = target.nextSibling
  if (node === next) {
    return
  }
  target.parentNode.insertBefore(node, next)
}
/**
 *
 * @param {Node} node
 */
function remove(node) {
  node.parentNode?.removeChild(node)
}

/**
 *
 * @param {Node} node
 * @param {Node} target
 */
function replace(node, target) {
  target.parentNode?.replaceChild(node, target)
}

/**
 *
 * @param {Element|DocumentFragment} parent
 * @param {Node} node
 */
function append(parent, node) {
  parent.appendChild(node)
}

/**
 *
 * @param {Node} node
 * @param {Element|DocumentFragment} parent
 */
function appendTo(node, parent) {
  append(parent, node)
}

/**
 *
 * @param {Element} node
 * @param {string} name
 */
function addClass(node, name) {
  node.classList.add(name)
}

/**
 *
 * @param {Element} node
 * @param {string} name
 */
function removeClass(node, name) {
  node.classList.remove(name)
}

/**
 *
 * @param {Element} node
 * @param {string} name
 * @param {function} Type
 * @returns
 */
function computeStyle(node, name, Type = String) {
  // TODO prefix: webkit, moz, ms
  return Type(getComputedStyle(node)[name])
}

/**
 * addEventListener => cancel()
 *
 * @param {Element} node
 * @param {string} name
 * @param {function} cb
 * @returns {function} cancel()
 */
function on(node, name, cb) {
  // TODO prefix
  node.addEventListener(name, cb)
  return function () {
    node.removeEventListener(name, cb)
  }
}

/**
 * on once
 *
 * @param {Element} node
 * @param {string} name
 * @param {function} cb
 */
function once(node, name, cb) {
  const off = on(node, name, function () {
    cb.apply(this, arguments)
    off()
  })
  return off
}

/**
 * on self
 *
 * @param {Element} node
 * @param {string} name
 * @param {function} cb
 */
function onSelf(node, name, cb) {
  return on(node, name, function (e) {
    if (e.currentTarget === e.target) {
      cb.apply(this, arguments)
    }
  })
}

/**
 * on once self
 *
 * @param {Element} node
 * @param {string} name
 * @param {function} cb
 */
function onceSelf(node, name, cb) {
  const off = on(node, name, function (e) {
    if (e.currentTarget === e.target) {
      cb.apply(this, arguments)
      off()
    }
  })
  return off
}

/**
 *
 * @param {string} html
 * @param {Element} container
 * @returns container
 */
function parseHTML(html, container = document.createElement('div')) {
  container.innerHTML = html
  return container
}

export {
  Fragment,
  insertBefore,
  insertAfter,
  remove,
  replace,
  append,
  appendTo,
  addClass,
  removeClass,
  computeStyle,
  on,
  once,
  onSelf,
  onceSelf,
  parseHTML,
}
