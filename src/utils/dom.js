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
 * @param {Node} newNode
 */
function replace(node, newNode) {
  node.parentNode?.replaceChild(newNode, node)
}

/**
 *
 * @param {Element|DocumentFragment} node
 * @param {Node|NodeList} childNodes
 */
function append(node, childNodes) {
  childNodes = childNodes.nodeType ? [childNodes] : [...childNodes]
  childNodes.forEach((child) => node.appendChild(child))
}

/**
 *
 * @param {string} html
 * @param {string} tag
 */
function Dom(html, tag = 'div') {
  const container = document.createElement(tag)
  container.innerHTML = html
  return container
}

/**
 *
 * @param {Node|NodeList} nodeList
 * @returns {DocumentFragment}
 */
function Fragment(nodeList) {
  const fragment = document.createDocumentFragment()
  if (typeof nodeList === 'string') {
    nodeList = Dom(nodeList).childNodes
  }
  append(fragment, nodeList)
  return fragment
}

/**
 *
 * @param {string} comment
 * @param {boolean} debug
 * @returns
 */
function Place(comment, debug) {
  return debug ? document.createComment(comment) : document.createTextNode('')
}

export { insert, remove, replace, append, Dom, Fragment, Place }
