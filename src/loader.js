import { parseHTML, remove } from './dom.js'
import Component from './Component.js'
import { compile } from './compile.js'

// fn(){code} => fn(){render(); code}
function injectRender(code, render = 'self.render();') {
  const functionReg = /\bfunction\b[^]*?\)\s*\{|=>\s*\{/g // function(){  =>{
  return code.replace(functionReg, `$& ${render}; `)
}

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
  static tpl =
\`${_container.innerHTML.replace(/[\\`$]/g, '\\$&')}\`

  create(){
    const self = this

    ${injectRender(
      scriptCode,
      'Promise.resolve("injected").then(()=>self.render());'
    )}

    ;
    this.render = function(){
      if(this.renderCheck()) return
      console.debug('render', this.target, {this:this})

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
