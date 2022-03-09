function loopNodeTree(node, cb) {
  if (!node) return
  const array = 'length' in node ? [...node] : [node]

  for (let i = 0; i < array.length; i++) {
    const node = array[i]
    cb(node)
    loopNodeTree(node.childNodes, cb)
  }
}

export {
  loopNodeTree as default,
  loopNodeTree,
}
