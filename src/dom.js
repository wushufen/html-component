/**
 *
 * @param {Node} node
 * @returns {Comment|Text}
 */
function Anchor(node, type) {
  console.log('type:', type)
  const anchor = Anchor.debug
    ? document.createComment(` ${type} ${node.localName || node.nodeName} `)
    : document.createTextNode('')

  node[type] = anchor
  anchor['#//<node>'] = node

  return anchor
}
Anchor.FOR_START = '#for_start'
Anchor.FOR_END = '#for_end'
Anchor.IF = '#if'
Anchor.COMPONENT_START = '#component_start'
Anchor.COMPONENT_END = '#component_end'

/**
 *
 * @param {Node} node
 * @returns {Node} node || IF || COMPONENT_START
 */
function getNodeFirst(node) {
  if (node.parentNode) {
    return node
  }
  if (node[Anchor.IF]?.parentNode) {
    return node[Anchor.IF]
  }
  if (node[Anchor.COMPONENT_START]?.parentNode) {
    return node[Anchor.COMPONENT_START]
  }
  return node
}

/**
 *
 * @param {Node} node
 * @returns {Node} node || IF || COMPONENT_END
 */
function getNodeLast(node) {
  if (node.parentNode) {
    return node
  }
  if (node[Anchor.IF]?.parentNode) {
    return node[Anchor.IF]
  }
  if (node[Anchor.COMPONENT_END]?.parentNode) {
    return node[Anchor.COMPONENT_END]
  }
  return node
}

/**
 *
 * @param {Node} node
 * @param {Node} target
 */
function insertBefore(node, target) {
  if (!node) return
  const nodeLast = getNodeLast(node)
  const targetFirst = getNodeFirst(target)

  if (nodeLast.nextSibling === targetFirst) {
    return
  }

  const fragment = document.createDocumentFragment()
  const component = node['#component']
  if (component) {
    fragment.appendChild(node[Anchor.COMPONENT_START])
    component.childNodes.forEach((c) => fragment.appendChild(c)) // TODO component firstChild[if]
    fragment.appendChild(node[Anchor.COMPONENT_END])
  } else {
    fragment.appendChild(node)
  }

  targetFirst.parentNode.insertBefore(fragment, targetFirst)
}

/**
 *
 * @param {Node} node
 * @param {Node} target
 */
function insertAfter(node, target) {
  if (!node) return
  const nodeFirst = getNodeFirst(node)
  const targetLast = getNodeLast(target)
  const targetLastNext = targetLast.nextSibling

  if (nodeFirst.previousSibling == targetLast) {
    return
  }

  if (targetLastNext) {
    insertBefore(node, targetLastNext)
  } else {
    const tempNext = document.createComment('temp')
    targetLast.parentNode.appendChild(tempNext)
    insertBefore(node, tempNext)
    tempNext.parentNode.removeChild(tempNext)
  }
}

/**
 *
 * @param {Node} node
 */
function remove(node) {
  node?.parentNode?.removeChild(node)
  if (node?.['#component']) {
    node['#component'].childNodes.forEach(remove)
    remove(node[Anchor.COMPONENT_START])
    remove(node[Anchor.COMPONENT_END])
  }
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
  if (!childNodes) return
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

export {
  Anchor,
  insertBefore,
  insertAfter,
  remove,
  replace,
  append,
  appendTo,
  parseHTML,
}
