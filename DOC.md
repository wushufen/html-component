DOC

---

## ${ }

Is consistent with js \``${}`\` template string syntax.
Both text nodes and attribute nodes work.
You can insert any variable or expression。

```html
<script>
  let value = 'world'

  const computed = {
    get value() {
      return value.toUpperCase()
    },
  }
</script>

<div title="Hello ${value} !">Hello ${computed.value} !</div>
```

Equivalent to the following JS

```javascript
div.setAttribute('title', `Hello ${value} !`)
div.innerText = `Hello ${computed.value} !`
```

_`object`, `array` Will try to convert to `json`. `undefined` Will not be output_

---

## .prop

`prop` means `dom property`

Same syntax as js `obj.key`、`obj[keyVar]`

The following is equivalent to js `div.title = text`

```html
<div .title="text">...</div>
```

Output rich text

The following is equivalent to js `div.innerHTML = html`

_In fact, the browser will automatically convert to lowercase `.innerhtml`, but the framework will automatically map any `js dom property`_

```html
<div .innerHTML="html"></div>
```

`this` represents the current node, You can access other properties of the current node

```html
<div .title="this.tagName">...</div>
```

Assigns the current node to a variable

_`.ref` can be any `.prop`, just to get the current node_

```html
<canvas .ref="el = this"></canvas>
```

The following is equivalent to js `div[propVar] = value`

_Due to HTML limitations, this way only supports variable names that are lowercase and do not allow spaces. But you can use the following way `...` to replace_

```html
<div [propVar]="value">...</div>
```

Batch Setting Properties

The following is equivalent to js `Object.assign(div, object)`

```html
<div ...="object"></div>
```

The following is equivalent to js `Object.assign(div, { [property]: value })`

```html
<div ...="{ [property]: value }"></div>
```

Custom `prop` `setter`

for example

```javascript
Component.defineSetter('asset', function (pass) {
  if (!pass) {
    console.error('asset:', value)
    debugger
  }
})
```

```html
<div .asset="a == b"></div>
```

`.class`

Built-in `setter` add or remove `css classes` by `bool`

```html
<div class="some" .class="{active: bool}" />
```

`.style`

Built-in `setter` automatically `+'px'` on demand

```html
<div style="height:10px" .style="{width: 10}" />
```

---

## if

Same syntax as js `if`, `else if`, `else`

```html
<div if="(bool)"></div>
```

```html
<div if="(bool)"></div>
<div else></div>
```

```html
<div if="(bool)"></div>
<div else if="(bool)"></div>
<div else if="(bool)"></div>
<div else></div>
```

_The parentheses can be omitted_

---

## for

Same syntax as js `for..in`, `for..of`

```html
<ul>
  <li for="(var key in object)">${object[key]}</li>
</ul>
```

```html
<ul>
  <li for="(const item of array)" onclick="alert(item)">${item}</li>
</ul>
```

```html
<ul>
  <li for="(const {id, name} of array)" onclick="alert(id)">${name}</li>
</ul>
```

_The parentheses can be omitted_

_If you're used to writing `(item, key?, index?) in list` that's fine_

_It has the same name as the `for` attribute of the `label` tag, but the syntax is different, so they do not conflict_

_If the same node `for` + `if` exists at the same time, `for` runs before `if`, regardless of the writing order. If you want to filter data, it is recommended to do so in the JS layer_

---

## on

Consistent with the native `DOM0` syntax, `this` refers to the current node and has an event variable named `event`, which accepts the code to execute

```html
<button onclick="console.log(this, event)">button</button>
```

The `.prop` syntax can also register events, which accept a function

The following is equivalent to js `button.onclick = console.count`

```html
<button .onclick="console.count">button</button>
```

---

## .prop + on (two-way-biding)

`.value` + `oninput`

```html
<input .value="text" oninput="text=this.value" />
```

Equivalent to the following js

```javascript
// Model -> View
input.value = text

// View -> Model
input.oninput = function (event) {
  text = this.value
}
```

Input `Number` type

```html
<input .value="number" oninput="number=Number(this.value)||0" />
```

`contenteditable` + `.innerText` + `oninput` Any element can be two-way-biding

```html
<div
  contenteditable="true"
  .innerText="text"
  oninput="text=this.innerText"
></div>
```

---

## Component

An `html` is a component, and each component instance has its own scope

```html
<!-- MyComponent.html -->
<script>
  let value = 'defaultValue'
  let log = console.log
</script>

<div .onclick="log">${value}</div>
```

Assigns values to internal variables of child components using the `.prop` syntax. You can pass any value, including functions, so that they have two-way communication

```html
<!-- App.html -->
<script>
  import MyComponent from './MyComponent.html'
</script>

<main>
  <MyComponent ...="{value:'myValue'}"></MyComponent>
  <!-- 或者 -->
  <div new="MyComponent" .log="alert"></div>
</main>
```

`this.constructor` is the class (constructor) of the current component, which can perform recursion, taking care to have termination conditions to avoid endless loops

```html
<script>
  let number = 10
</script>

<main>
  <div>${number}</div>
  <div if="number" new="this.constructor" .number="number-1" />
</main>
```

`mode` component mode

ets how the component is referenced. _One component allow multiple root nodes_

- replace: By default, the component root node is replaced with the original label location
- wrap: Keep the original label and include the component root node
- web: Use the web component

```html
<User mode="wrap"></User>
<div new="User" mode="web"></div>
```

Setting the Default mode

```javascript
Component.defaultMode = 'replace'
```
