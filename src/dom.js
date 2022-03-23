/**
 *
 * @param {Node} node
 * @param {Node} to
 */
function insertBefore(node, to) {
  if (node.nextSibling === to) {
    return
  }
  to.parentNode.insertBefore(node, to)
}

/**
 *
 * @param {Node} node
 * @param {Node} to
 */
function insertAfter(node, to) {
  // TODO 枚举 Anchor
  if (!to.parentNode) {
    if (to[Anchor.IF]?.parentNode) {
      to = to[Anchor.IF]
    } else if (to['#component']?.childNodes[0]?.parentNode) {
      to = Array.from(to['#component'].childNodes).pop()
    }
  }

  const next = to.nextSibling
  console.log('next:', node, next)
  if (node === next) {
    return
  }
  if (next) {
    insertBefore(node, next)
  } else {
    to.parentNode.appendChild(node)
  }
}

/**
 *
 * @param {Node} node
 * @param {Node} to
 */
function insert(node, to) {
  if (!node.parentNode) {
    to.parentNode?.insertBefore(node, to)
  }
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
 * @param {Node|Node[]|NodeList} newNodes
 */
function replace(node, newNodes) {
  if (newNodes.nodeType) {
    node.parentNode?.replaceChild(newNodes, node)
  } else {
    const fragment = document.createDocumentFragment()
    newNodes.forEach((newNode) => fragment.appendChild(newNode))
    node.parentNode?.replaceChild(fragment, node)
  }
}

/**
 *
 * @param {Element|DocumentFragment} node
 * @param {Node|Node[]|NodeList} childNodes
 */
function append(node, childNodes) {
  childNodes = childNodes.nodeType ? [childNodes] : Array.from(childNodes)
  childNodes.forEach((child) => node.appendChild(child))
}

/**
 *
 * @param {Node} node
 * @param {Node} parent
 */
function appendTo(node, parent) {
  append(parent, node)
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

/**
 *
 * @param {string} string
 * @param {boolean} debug
 * @returns {Node}
 */
function Anchor(string) {
  if (Anchor.debug) {
    return document.createComment(` ${string} `)
  } else {
    return document.createTextNode('')
  }
}
Anchor.FOR_START = '#FOR_START'
Anchor.FOR_END = '#FOR_END'
Anchor.IF = '#IF'
Anchor.COMPONENT_START = '#COMPONENT_START'
Anchor.COMPONENT_END = '#COMPONENT_END'

export {
  insertBefore,
  insertAfter,
  insert,
  remove,
  replace,
  append,
  appendTo,
  parseHTML,
  Anchor,
}
