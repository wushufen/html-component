# html-component

English | <a href="./README.zh-CN.md">中文</a>

An `HTML` enhancement framework

Feature:

- `html` **componentization**, **two way binding**
- **High performance**, no data hijacking, no virtual DOM
- **Full `js` capability**, without changing programming habits
- **Template syntax is the same as `js`**, no memory burden
- **Easy to learn**, only takes `3` minutes to master

---

## TRY

- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/counter.html">Playground</a>

```html
<button onclick="count++">count: ${count}</button>

<script>
  let count = 0
</script>
```

Example:

- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/helloWorld.html">Hello world</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/time.html">Time</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/counter.html">Counter</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/innerHTML.html">Rich text</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/listSort.html">List sort</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/towWayBinding.html">Tow-way-binding</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/style.html">Style</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/snowflake.html">Snowflake</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/svg.html">SVG</a>

---

## Install

`<script>`

```html
<script
  type="module"
  src="https://wushufen.github.io/html-component/src/index.js"
></script>
```

`npm`

```
npm i -D @wushufen/html-component
```

---

## Syntax

- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/syntax.html">Syntax</a>

<!-- prettier-ignore -->
```html
Template syntax                                 Compiled js

<!-- ${} -->
<div>Hello ${'world'}</div>                     div.childNodes[0].nodeValue = `Hello ${'world'}`
<div attr="Hello ${'world'}"></div>             div.setAttribute('attr', `Hello ${'world'}`)

<!-- .prop -->
<div .prop="1 * 1"></div>                       div.prop = 1 * 1
<div [prop]="1 + 1"></div>                      div[prop] = 1 + 1
<div ...="{prop: 1, [prop]: 2}"></div>          ...{prop: 1, [prop]: 2}

<!-- if -->
<div if="(bool)"></div>                         if (bool) { }
<div else if="(bool)"></div>                    else if (bool) { }
<div else></div>                                else { }

<!-- for -->
<div for="(const item of array)"></div>         for (const item of array) { }
<div for="(var key in object)"></div>           for (var key in object) { }

<!-- on -->
<div onclick="change(event, this)">dom0</div>   div.onclick = function(event){ change(event, this) }
<div .onclick="console.log">.prop</div>         div.onclick = console.log

<!-- .prop + on (two-way-binding) -->
<input .value="text" oninput="text=this.value"> input.value = text
                                                input.oninput = function(event){ text=this.value }

<!-- component -->
<User .a="1" ...="{b: 2}"></User>               new User({props:{a: 1, ...{b: 2}}})


<!--
  Both variables of the current component and global variables
  can be used in the template
-->
<script>
  import User from './User.html'

  // Any data type
  var bool = true
  let text = 'world'
  const prop = 'title'
  const object = { a: 1, b: 2 }
  const array = [1, 2, 3, 4, 5]

  // There is no limit to how data is updated
  function  change() {
    bool = !bool
    text = text.slice(1) + text[0]
    object.key = 'value'
    array.length -= 1
    array.push((Math.random() * 10) | 0)
    array.sort((a, b) => Math.random() - 0.5)
  }
</script>
```

---

## DOC

<a href="./DOC.md">detailed introduction</a>
