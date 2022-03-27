const hasOwnProperty = Object.prototype.hasOwnProperty

// [] -> each
function forEach(arrayLike, fn) {
  if (!arrayLike) return
  for (var i = 0; i < arrayLike.length; i++) {
    var rs = fn.call(this, arrayLike[i], i)
    if (rs !== undefined) return rs // can break
  }
}

// [] | {} -> each
function each(list, cb) {
  if (list instanceof Array) {
    forEach(list, function (item, i) {
      cb(item, i, i)
    })
  } else if (window.Symbol && list?.[Symbol.iterator]) {
    const iterator = list[Symbol.iterator]()
    let index = 0
    let step
    while (((step = iterator.next()), !step.done)) {
      cb(step.value, index, index++)
    }
  } else {
    let index = 0
    for (const key in list) {
      if (hasOwnProperty.call(list, key)) {
        const item = list[key]
        cb(item, key, index++)
      }
    }
  }
}

function last(array) {
  return array[array.length - 1]
}

// object, key => bool
function hasOwn(object, key) {
  return object && hasOwnProperty.call(object, key)
}

const objIdWm = new WeakMap()
function getObjId(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  } else {
    let id = obj.id || objIdWm.get(obj)
    if (!id && id !== 0) {
      id = objIdWm.set(obj, Math.random())
    }
    return id
  }
}

export { hasOwnProperty, forEach, each, last, hasOwn, getObjId }
