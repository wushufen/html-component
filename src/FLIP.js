import { onSelf, addClass, removeClass, computeStyle } from './dom.js'
import { requestAnimationFrame } from './hijack.js'
/**
 * @see
 * https://aerotwist.com/blog/flip-your-animations/
 * https://github.com/googlearchive/flipjs
 */

/*
var el = $0; s = el.style

// f
f = el.getBoundingClientRect()

// l
el.classList.add('test1')
l = el.getBoundingClientRect()

// i
s.transformOrigin = '0 0'
s.transform = `translate(${f.x-l.x}px, ${f.y-l.y}px) scale(${f.width/l.width}, ${f.height/l.height})`

// p
el.offsetHeight // reflow
requestAnimationFrame(()=>{
  s.transition = '5s'
  s.transform = ''
})
 */

/**
 *
 * @example
 * const flip = new FLIP(el, {opacity:true})
 * flip.first()
 *
 * el.classList.addClass('test')
 * flip.last()
 *
 * flip.invert()
 *
 * flip.play(duration)
 *
 * @example
 * flip.addClass(className, duration)
 * flip.removeClass(className, duration)
 */
class FLIP {
  /**@type {Element} */
  el = null
  style = null
  style0 = null
  f = null
  l = null
  FLIP_KEY = '#_FLIP_'
  /**
   *
   * @param {Element} el
   * @param {object} options
   * @returns
   */
  constructor(el, options) {
    const flip = el[FLIP.FLIP_KEY]
    if (flip) {
      flip.cancel()
      return flip
    }
    el[FLIP.FLIP_KEY] = this

    const style = el.style
    this.el = el
    this.style = style
    this.options = options

    this.style0 = {
      'transform-origin': style['transform-origin'],
      transform: style.transform,
      transition: style.transition,
    }
    for (const key in this.options) {
      this.style0[key] = style[key]
    }
  }
  compute({ rect = true, style = this.options } = {}) {
    const info = {
      rect: rect ? this.el.getBoundingClientRect() : {},
      style: {},
    }
    for (const name in style) {
      if (style[name]) {
        info.style[name] = computeStyle(this.el, name)
      }
    }
    return info
  }
  first() {
    this.f = this.compute()
  }
  last() {
    Object.assign(this.style, {
      ...this.style0,
      transition: 'initial',
    })
    this.l = this.compute({ style: null })
  }
  invert() {
    const fr = this.f.rect
    const lr = this.l.rect
    Object.assign(this.style, {
      ...this.f.style,
      'transform-origin': '0 0',
      transform: `
        translate(${fr.left - lr.left}px, ${fr.top - lr.top}px)
        scale(${fr.width / lr.width}, ${fr.height / lr.height})`,
    })
  }
  play(duration = 0.5) {
    this.ts = requestAnimationFrame(() => {
      this.reflow()
      Object.assign(this.style, {
        ...this.style0,
        transition: `${duration}s`,
      })

      const finish = this.finish.bind(this)
      this.off = onSelf(this.el, 'transitionend', finish)
      this.off2 = onSelf(this.el, 'transitioncancel', finish)
    })
  }
  cancel() {
    cancelAnimationFrame(this.ts)
    this.off?.()
    this.off2?.()
  }
  finish() {
    this.cancel()
    Object.assign(this.style, this.style0)
    delete this.el[FLIP.FLIP_KEY]
  }
  reflow() {
    if (!this._reflow) {
      this._reflow = true
      requestAnimationFrame(() => {
        this._reflow = false
      })
      return document.body.offsetHeight
      // return this.el.offsetHeight
    }
  }
  _addClass(className) {
    addClass(this.el, className)
  }
  _removeClass(className) {
    removeClass(this.el, className)
  }
  addClass(className, duration) {
    this.first()
    this._addClass(className)
    this.last()
    this.invert()
    this.play(duration)
  }
  removeClass(className, duration) {
    this.first()
    this._removeClass(className)
    this.last()
    this.invert()
    this.play(duration)
  }
}

export { FLIP as default, FLIP }
