import { loader } from './loader.js'

const HelloWorld = loader(
  `
  <hr>
  <div>Hello \${value}</div>
  <button onclick="x++">\${x}</button>
  <hr>

  <script>
    var value = 'world'
    var x = 1

    console.log('HelloWorld create', this.target)

    this.onload = function(e){
      console.log('HelloWorld', e.type, this.target, e.props, e.lastProps)

      value = e.data.value || value
    }
    this.onchange = this.onload
    this.onunload = function () {
      console.log('HelloWorld onunload', arguments)
    }
  </script>
  `,
  'HelloWorld'
)

export { HelloWorld as default, HelloWorld }
