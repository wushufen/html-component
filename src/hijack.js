export const setTimeout = window.setTimeout
export const queueMicrotask = window.queueMicrotask
export const requestAnimationFrame = window.requestAnimationFrame

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
  [window, 'setTimeout', window.setTimeout, 'task'],
  [window, 'setInterval', window.setInterval, 'task'],
  [window, 'requestAnimationFrame', window.requestAnimationFrame, 'task'],
  // microTask
  [window, 'queueMicrotask', window.queueMicrotask, 'task'],
  [Promise.prototype, 'then', Promise.prototype.then, 'task'],
  [Promise.prototype, 'catch', Promise.prototype.catch, 'task'],
  [Promise.prototype, 'finally', Promise.prototype.finally, 'task'],
  [window, 'MutationObserver', window.MutationObserver, 'Task'],
  // eventTarget.addEventListener
  [EventTarget.prototype, 'addEventListener', EventTarget.prototype.addEventListener, 'on'],
  [EventTarget.prototype, 'removeEventListener', EventTarget.prototype.removeEventListener, 'off'],
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
  // ['Image', Image],
  // ['Audio', Audio],
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
function hijackFn(component, fn) {
  const fn_ = function () {
    hijackFnBefore(component, fn)
    const rs = fn.apply(this, arguments)
    hijackFnAfter(component, fn)
    return rs
  }

  fn_.__native = fn
  fn.__hijacked = fn_

  return fn_
}

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
    } else if (type === 'on') {
      object[key] = function () {
        arguments[1] = hijackFn(component, arguments[1])
        return fun.apply(this, arguments)
      }
    } else if (type === 'off') {
      object[key] = function () {
        arguments[1] = arguments[1].__hijacked || arguments[1]
        return fun.apply(this, arguments)
      }
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

function hijackFnAfter(component, fn) {
  // render
  component.render()

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

export { hijackFnBefore, hijackFnAfter, hijackFn }
