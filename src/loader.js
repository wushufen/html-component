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

    // <script>
    ${scriptCode}
    // </script>

    this.render = function(){
      ${code}
    }
    this.render()
  }
}
)`
  )(Component)
}

export { loader as default, loader }
