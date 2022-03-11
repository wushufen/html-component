```javascript
class HComponent {}

class Component extends HComponent {}

stringTpl: course.html

parsedStringTpl: compiled.html

nodeTpl

parsedNodeTpl
```

```javascript
class HComponent {
  static compiledTpl = `
    <h1><text id_="text:1">\${date.toLocaleString()}</text></h1>
  `
  container = null
  nodeMap = {}
  constructor() {
    // create dom
    this.container = parseHTML(this.constructor.compiledTpl)
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
  render() {
    var self = this

    // <script>
    var date = new Date()
    setInterval(function () {
      date = new Date()
      /* --inject render-- */
      self.render()
    }, 1000)
    // </script>

    this.render = function ($props) {
      self.text('text:1', `${date}`)
    }
    this.render()
  }
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
  static compiledTpl = `
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
