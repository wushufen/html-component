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
      if (hasOwnProperty(list, key)) {
        const item = list[key]
        cb(item, key, index++)
      }
    }
  }
}

// object, key => bool
function hasOwnProperty(object, key) {
  return Object.hasOwnProperty.call(object, key)
}

export { forEach, each }
