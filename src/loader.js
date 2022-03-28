import { parseHTML, remove } from './dom.js'
import Component from './Component.js'
import { compile } from './compile.js'

/**
 *
 * @param {string} html
 * @param {string} className
 * @returns {Component}
 */
function loader(html, className = '') {
  const _container = parseHTML(html)
  const { scriptCode, code } = compile(_container)

  // - <script>
  Array.from(_container.getElementsByTagName('script')).forEach(remove)

  return Function(
    'Component',
    `return (
class ${className} extends Component {
  static tpl = \`${_container.innerHTML.replace(/[\\`$]/g, '\\$&')}\`

  create(){
    const self = this

    /* <script> ==================== */
    ${scriptCode}
    /* ==================== */

    // render
    this.render = function(){
      // lock: render=>render
      if(this.render.lock) {
        console.warn('render circular!', self, self.node)
        return
      }
      // throttle
      if (new Date - this.render.lastTime < this.render.delay) {
          clearTimeout(this.render.timer)
          this.render.timer = setTimeout(function () {
              self.render()
          }, this.render.delay)
          return
      }
      this.render.lastTime = new Date
      this.render.lock = true

      /* dom ==================== */
      ${code}
      /* ==================== */
      
      // -lock
      this.render.lock = false
    }
    this.render.lastTime = 0
    this.render.delay = 1000 / 60 - 6
  }
}
)`
  )(Component)
}

export { loader as default, loader }
