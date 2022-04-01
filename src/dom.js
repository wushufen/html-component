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
  parseHTML,
}
