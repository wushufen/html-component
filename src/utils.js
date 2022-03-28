/**
 * [] -> each
 * @param {*} arrayLike !!.length
 * @param {function} cb
 * @returns
 */
function forEach(arrayLike, cb) {
  if (!arrayLike) return
  for (var i = 0; i < arrayLike.length; i++) {
    var rs = cb.call(this, arrayLike[i], i)
    if (rs !== undefined) return rs // can break
  }
}

/**
 * [] | {} -> each
 * @param {*} list
 * @param {function} cb
 */
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

/**
 * hasOwnProperty.call(object, 'key')
 */
const hasOwnProperty = Object.prototype.hasOwnProperty

/**
 *
 * @param {Object} object
 * @param {string} key
 * @returns {boolean}
 */
function hasOwn(object, key) {
  return object && hasOwnProperty.call(object, key)
}

/**
 *
 * @param {*} object
 * @returns {string} Type
 */
function typeOf(object) {
  return toString.call(object).slice(8, -1)
}

/**
 *
 * @param {*} object
 */
function deepClone(object) {
  const cache = new Map()

  function clone(object) {
    const type = typeOf(object)
    let _object = object

    const lastClone = cache.get(object)
    if (lastClone) {
      return lastClone
    }

    if (type === 'Object' || type === 'Array') {
      _object = type === 'Object' ? {} : []
      cache.set(object, _object)

      for (const key in object) {
        const value = object[key]
        _object[key] = clone(value)
      }
    }

    return _object
  }

  return clone(object)
}

/**
 *
 * @param {*} object
 * @param {*} _object
 * @returns {boolean} same?
 */
function deepSame(object, _object) {
  const cache = new Map()

  function check(object, _object) {
    const type = typeOf(object)
    const _type = typeOf(_object)

    if (object === _object) {
      return true
    }
    if (cache.get(object)) {
      return true
    }

    if (type === _type && (type === 'Object' || type === 'Array')) {
      if (object.length !== _object.length) {
        return false
      }

      cache.set(object, true)
      for (const key in _object) {
        if (!check(object[key], _object[key])) {
          return false
        }
      }
      // --
      for (const key in object) {
        if (!(key in _object)) {
          return false
        }
      }
      return true
    }

    return object === _object
  }

  return check(object, _object)
}

export { forEach, each, hasOwnProperty, hasOwn, typeOf, deepClone, deepSame }
