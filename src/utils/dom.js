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
 * @param {string} comment
 * @param {boolean} debug
 * @returns
 */
function createPlace(comment, debug) {
  return debug ? document.createComment(comment) : document.createTextNode('')
}

export { insert, remove, replace, createPlace }
