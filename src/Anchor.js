/**
 *
 * @param {Node} node
 * @returns {Comment|Text}
 */
function Anchor(node, type) {
  const anchor = Anchor.debug
    ? document.createComment(` <${node.localName || node.nodeName}> ${type} `)
    : document.createTextNode('')

  node[type] = anchor
  anchor['#//<node>'] = node

  return anchor
}
Anchor.FOR_START = '#<for_start>'
Anchor.FOR_END = '#<for_end>'
Anchor.IF = '#<if>'

const IF_FALSE = '#ifFalse'
/**
 *
 * @param {Node} node
 * @returns {Node} node || IF
 */
function ifAnchor(node) {
  return node[IF_FALSE] ? node[Anchor.IF] : node
}

export { Anchor as default, Anchor, ifAnchor, IF_FALSE }
