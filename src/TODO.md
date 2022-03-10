```javascript
class HComponent {}

class Component extends HComponent {}

nodeTpl

parsedNodeTpl

stringTpl

parsedStringTpl
```

```javascript
class HComponent {
  static tpl = `
  <h1>Hello world!</h1>
  `
  container = null
  nodeMap = {}
  constructor(tpl = this.constructor.tpl) {
    // node
    if (tpl.nodeType) {
      // compile
      const { container, scriptCode, code } = compile(tpl)
      this.container = container
      this.render = Function(`
        ${code}
      `)
    }
    // string: compiled tpl
    else {
      this.container = parseHTML(this.tpl)
    }
  }
  $(id) {
    return (
      this.nodeMap[id] || (this.nodeMap[id] = queryNode(this.container, id))
    )
  }
  text() {}
  prop() {}
  on() {}
  for() {}
  if() {}
  is() {}
  render() {}
}

// App.html
/*

<script>
var text = 'world'
</script>

<h2>${text}</h2>

*/
import HComponent from './HComponent.js'

class Component extends HComponent {
  static tpl = `
    <h2><text id_="text:1">\${text}</text></h2>
  `
  render($props) {
    var self = this

    // <script>
    var text = 'world'
    // </script>

    // render
    this.render = function ($props) {
      self.text('text:1', `${text}`)
    }

    this.render()
  }
}
```
