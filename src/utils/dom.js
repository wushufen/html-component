// node, target -> <node><!-- target -->
function insertNode(node, target) {
  if (node.parentNode) return
  target.parentNode?.insertBefore(node, target)
}

// node -> --
function removeNode(node) {
  node.parentNode?.removeChild(node)
}

// node, name => attrValue
function getAttribute(node, name) {
  return node?.getAttribute?.(name) || ''
}

// node, name => attrValue
function setAttribute(node, name, value) {
  node?.setAttribute?.(name, value)
}

// node, name => bool
function hasAttribute(node, name) {
  return node?.hasAttribute?.(name) || false
}

// attrName => --
function removeAttribute(node, name) {
  node?.removeAttribute?.(name)
}

// 'innerhtml' => 'innerHTML'
function attr2prop(node, attr) {
  var prop = attr2prop[`prop:${attr}`] // cache
  if(prop) return prop

  for (prop in node) {
    if (prop.toLowerCase() === attr) {
      attr2prop[`prop:${attr}`] = prop
      return prop
    }
  }

  prop = {
    class: 'className',
  }[attr] || attr

  return prop
}

// + .class
function addClass(node, name) {
  node.classList.add(name)
}

// - .class
function removeClass(node, name) {
  node.classList.remove(name)
}

// => computedStyle[name]
function computeStyle(node, name, Type = String) {
  // TODO prefix: webkit, moz, ms
  return Type(getComputedStyle(node)[name])
}

// + addEventListener => cancel()
function on(node, name, cb) {
  // TODO prefix
  node.addEventListener(name, cb)
  return function () {
    node.removeEventListener(name, cb)
  }
}

export {
  insertNode,
  removeNode,
  getAttribute,
  setAttribute,
  hasAttribute,
  removeAttribute,
  attr2prop,
  addClass,
  removeClass,
  computeStyle,
  on,
}
