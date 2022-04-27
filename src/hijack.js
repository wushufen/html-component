// backup native
export const setTimeout = window.setTimeout
export const clearTimeout = window.clearTimeout
export const setInterval = window.setInterval
export const clearInterval = window.clearInterval
export const requestAnimationFrame = window.requestAnimationFrame
export const cancelAnimationFrame = window.cancelAnimationFrame
export const addEventListener = window.addEventListener
export const removeEventListener = window.removeEventListener

/**
 * setTimeout(hijackFn(component, fn))
 * queueMicrotask(hijackFn(component, fn))
 * eventTarget.addEventListener('event', hijackFn(component, fn))
 * eventTarget.removeEventListener('event', fn.__hijacked)
 * document.createElement('img').onload = hijackFn(component, fn)
 * new EventTarget().onevent = hijackFn(component, fn)
 */

/* prettier-ignore */
const methodList = [
  // [object, key, method, type]
  // macroTask
  // [window, 'setTimeout', window.setTimeout, 'task'],
  // [window, 'setInterval', window.setInterval, 'task'],
  // [window, 'requestAnimationFrame', window.requestAnimationFrame, 'task'],
  // microTask
  [window, 'queueMicrotask', window.queueMicrotask, 'task'],
  [Promise.prototype, 'then', Promise.prototype.then, 'task'],
  [Promise.prototype, 'catch', Promise.prototype.catch, 'task'],
  [Promise.prototype, 'finally', Promise.prototype.finally, 'task'],
  [window, 'MutationObserver', window.MutationObserver, 'Task'],
  // eventTarget.addEventListener
  // [EventTarget.prototype, 'addEventListener', EventTarget.prototype.addEventListener, 'on'],
  // [EventTarget.prototype, 'removeEventListener', EventTarget.prototype.removeEventListener, 'off'],
  // return eventTarget => .on__
  [document, 'createElement', document.createElement, 'eventTarget'],
  [document, 'querySelector', document.querySelector, 'eventTarget'],
  [document, 'querySelectorAll', document.querySelectorAll, 'eventTarget[]'],
  [document, 'getElementById', document.getElementById, 'eventTarget'],
  [document, 'getElementsByName', document.getElementsByName, 'eventTarget[]'],
  [document, 'getElementsByTagName', document.getElementsByTagName, 'eventTarget[]'],
  [document, 'getElementsByTagNameNS', document.getElementsByTagNameNS, 'eventTarget[]'],
  [document, 'getElementsByClassName', document.getElementsByClassName, 'eventTarget[]'],
  [Element.prototype, 'cloneNode', Element.prototype.cloneNode, 'eventTarget'],
  [Element.prototype, 'querySelector', Element.prototype.querySelector, 'eventTarget'],
  [Element.prototype, 'querySelectorAll', Element.prototype.querySelectorAll, 'eventTarget[]'],
  [Element.prototype, 'getElementsByTagName', Element.prototype.getElementsByTagName, 'eventTarget[]'],
  [Element.prototype, 'getElementsByTagNameNS', Element.prototype.getElementsByTagNameNS, 'eventTarget[]'],
  [Element.prototype, 'getElementsByClassName', Element.prototype.getElementsByClassName, 'eventTarget[]'],
]

// new EventTarget().on__
const SubEventTargetList = [
  // [SubEventTargetName, SubEventTarget]
  ['Image', Image], // new Image() instanceof Node
  ['Audio', Audio], // new Audio() instanceof Node
  // ['Worker', Worker],
  // ['WebSocket', WebSocket],
  // ['SharedWorker', SharedWorker],
  // ['XMLHttpRequest', XMLHttpRequest],
  // ['FileReader', FileReader],
]
for (const name of Object.getOwnPropertyNames(window)) {
  const Class = window[name]
  if (
    typeof Class === 'function' &&
    Class.prototype instanceof EventTarget &&
    !(Class.prototype instanceof Node)
  ) {
    SubEventTargetList.push([name, Class])
  }
}

/*
setTimeout(fn)
=>
setTimeout(function(){
  before(fn)
  const rs = fn.apply(this, arguments)
  after(fn)
  return rs
})
*/
function hijackFn(component, fn, cb = null) {
  const fn_ = function () {
    hijackFnBefore(component, fn)
    const rs = fn.apply(this, arguments)
    hijackFnAfter(component, fn)
    cb?.()
    return rs
  }

  fn_.__native = fn
  fn.__hijacked = fn_

  return fn_
}

/**
 *
 * @param {Component} component
 * @param {Function} fn
 */
function hijackFnBefore(component, fn) {
  const eventTargetList = (fn.__eventTargetList = [])
  const globalEventTargetList = (fn.__globalEventTargetList = (function () {
    const code = component.create.toString()
    const list = [
      /window/.test(code) && [window, {}],
      /document/.test(code) && [document, {}],
      /document.documentElement/.test(code) && [document.documentElement, {}],
      /document.body/.test(code) && [document.body, {}],
    ].filter(Boolean)
    return list
  })())
  const onPropertyMap = (fn.__onPropertyMap = (function () {
    const map = {}
    const reg = /[.'"`](on\w+)\b/g
    const code = component.create.toString()
    let m
    while ((m = reg.exec(code))) {
      map[m[1]] = true
    }
    return map
  })())

  // hijack timer
  function hijackTimer(setName, set, clearName, clear, isRunClear) {
    window[setName] = function () {
      arguments[0] = hijackFn(
        component,
        arguments[0],
        isRunClear
          ? function () {
              delete component[`${setName}Store`]?.[rs]
            }
          : undefined
      )
      const rs = set.apply(this, arguments)
      const store =
        component[`${setName}Store`] || (component[`${setName}Store`] = {})
      store[rs] = true
      return rs
    }
    window[setName].__native = set
    set.__hijacked = window[setName]

    window[clearName] = function (i) {
      const rs = clear.apply(this, arguments)
      const store = component[`${setName}Store`]
      delete store?.[i]
      return rs
    }
    window[clearName].__native = clear
    clear.__hijacked = window[clearName]
  }
  hijackTimer('setTimeout', setTimeout, 'clearTimeout', clearTimeout, true)
  hijackTimer(
    'requestAnimationFrame',
    requestAnimationFrame,
    'cancelAnimationFrame',
    cancelAnimationFrame,
    true
  )
  hijackTimer('setInterval', setInterval, 'clearInterval', clearInterval)

  // hijack addEventListener
  const eventTargetProto = EventTarget.prototype
  eventTargetProto.addEventListener = function () {
    const key = 'addEventListener'
    const set = addEventListener
    arguments[1] = hijackFn(component, arguments[1])
    const store = component[`${key}Store`] || (component[`${key}Store`] = [])
    store.push([this, arguments])
    console.log('store:', store)
    return set.apply(this, arguments)
  }
  eventTargetProto.addEventListener.__native = addEventListener
  addEventListener.__hijacked = eventTargetProto.addEventListener

  eventTargetProto.removeEventListener = function (type, fn) {
    const key = 'addEventListener'
    const clear = removeEventListener
    arguments[1] = arguments[1].__hijacked || arguments[1]
    const store = component[`${key}Store`] || (component[`${key}Store`] = [])
    for (let i = 0; i < store.length; i++) {
      const [_type, _fn] = store[i]
      if (_type === type && _fn === fn) {
        store.splice(i, 1)
        break
      }
    }
    return clear.apply(this, arguments)
  }
  eventTargetProto.removeEventListener.__native = removeEventListener
  removeEventListener.__hijacked = eventTargetProto.removeEventListener

  // hijack method
  for (const item of methodList) {
    const [object, key, fun, type] = item
    if (type === 'task') {
      object[key] = function () {
        arguments[0] = hijackFn(component, arguments[0])
        return fun.apply(this, arguments)
      }
    } else if (type === 'Task') {
      object[key] = function () {
        arguments[0] = hijackFn(component, arguments[0])
        return new fun(...arguments)
      }
      object[key].prototype = fun.prototype
    } else if (type === 'eventTarget') {
      object[key] = function () {
        const el = fun.apply(this, arguments)
        eventTargetList.push(el)
        return el
      }
    } else if (type === 'eventTarget[]') {
      object[key] = function () {
        const els = fun.apply(this, arguments)
        eventTargetList.push(...els)
        return els
      }
    }
    object[key].__native = fun
    fun.__hijacked = object[key]
  }

  // hijack new EventTarget()
  for (const item of SubEventTargetList) {
    const [name, SubEventTarget] = item

    const _SubEventTarget = function () {
      const eventTarget = new SubEventTarget(...arguments)
      eventTargetList.push(eventTarget)
      return eventTarget
    }
    _SubEventTarget.prototype = SubEventTarget.prototype
    _SubEventTarget.__native = SubEventTarget
    SubEventTarget.__hijacked = _SubEventTarget

    window[name] = _SubEventTarget
  }

  // globalEventTarge.on_ before fn
  for (const item of globalEventTargetList) {
    const [eventTarget, beforeFnOnMap] = item
    for (const on_ in onPropertyMap) {
      const fn = eventTarget[on_]
      if (fn === 'function') {
        beforeFnOnMap[on_] = fn
      }
    }
  }
}

/**
 *
 * @param {Component} component
 * @param {Function} fn
 */
function hijackFnAfter(component, fn) {
  // render
  component.render()

  // restore
  window.setTimeout = setTimeout
  window.clearTimeout = clearTimeout
  window.setInterval = setInterval
  window.clearInterval = clearInterval
  window.requestAnimationFrame = requestAnimationFrame
  window.cancelAnimationFrame = cancelAnimationFrame
  EventTarget.prototype.addEventListener = addEventListener
  EventTarget.prototype.removeEventListener = removeEventListener

  // restore method
  for (const item of methodList) {
    const [object, key, fun] = item
    object[key] = fun
  }

  // restore SubEventTarget
  for (const item of SubEventTargetList) {
    const [name, SubEventTarget] = item
    window[name] = SubEventTarget
  }

  // hijack eventTarget.on__
  const eventTargetList = fn.__eventTargetList
  for (const target of eventTargetList) {
    for (const on_ in target) {
      if (/^on/.test(on_) && typeof target[on_] === 'function') {
        const fn = target[on_]
        target[on_] = hijackFn(component, fn)
      }
    }
  }

  // hijack globalEventTarge.on_
  const globalEventTargetList = fn.__globalEventTargetList
  const onPropertyMap = fn.__onPropertyMap
  for (const item of globalEventTargetList) {
    const [eventTarget, beforeFnOnMap] = item
    for (const on_ in onPropertyMap) {
      const beforeFnOn = beforeFnOnMap[on_]
      const afterFnOn = eventTarget[on_]
      if (afterFnOn !== beforeFnOn && typeof afterFnOn === 'function') {
        eventTarget[on_] = hijackFn(
          component,
          // maybe: querySelector('body').on__
          afterFnOn.__native || afterFnOn
        )
      }
      delete beforeFnOnMap[on_]
    }
  }

  // !!!no: eventTarget = xx(); setTimeout(function(){ eventTarget.on__ = yy})
}

/**
 * cancel timer and event handler when component destroy
 * @param {Component} component
 */
function hijackDestroy(component) {
  for (const key in component.setTimeoutStore) {
    clearTimeout(key)
  }
  for (const key in component.setIntervalStore) {
    clearInterval(key)
  }
  for (const key in component.requestAnimationFrameStore) {
    cancelAnimationFrame(key)
  }
  for (const item of component.addEventListenerStore || []) {
    removeEventListener.apply(item[0], item[1])
  }
}

export { hijackFn, hijackFnBefore, hijackFnAfter, hijackDestroy }
