import { parseHTML, remove } from './dom.js'
import Component from './Component.js'
import { compile } from './compile.js'

/**
 *
 * @param {string} html
 * @param {string} ClassName
 * @returns {Component}
 */
function loader(html, ClassName = '') {
  const _container = parseHTML(html)
  const { scriptCode, code } = compile(_container)

  // - <script>
  Array.from(_container.getElementsByTagName('script')).forEach(remove)

  return Function(
    'Component',
    `return (
class ${ClassName} extends Component {
  static tpl = \n\`${_container.innerHTML.replace(/[\\`$]/g, '\\$&')}\`

  create(){
    const self = this

    \n${scriptCode};

    this.render = function(){
      // console.warn('render', {this:this})
      if(this.renderCheck()) return

      \n${code}

      // -lock
      this.renderLock = false
    }
  }
}
)`
  )(Component)
}

export { loader as default, loader }
