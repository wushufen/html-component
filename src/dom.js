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
  childNodes = childNodes.nodeType ? [childNodes] : [...childNodes]
  childNodes.forEach((child) => node.appendChild(child))
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
 * @param {string} comment
 * @param {boolean} debug
 * @returns {Node}
 */
function createComment(comment, debug) {
  return debug ? document.createComment(comment) : document.createTextNode('')
}

export { insert, remove, replace, append, parseHTML, createComment }
