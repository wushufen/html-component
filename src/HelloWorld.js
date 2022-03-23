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
  </script>
  `,
  'HelloWorld'
)

export { HelloWorld as default, HelloWorld }
