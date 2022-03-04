# HtmlComponent

一个语法简单但是功能强大的 `mvvm` 框架，它赋予了 `html` 自动更新视图和组件化的能力。

它的目标是增强 `html` 而不是创造一门语言，你一分钟就能掌握它。

---

## 安装

通过 `<script>` 标签引入，即可让 `html` 拥有自动更新视图的能力

```html
<html>
  <head>
    <script src="../src/HtmlComponent.js"></script>
  </head>
  <body>
    <button onclick="click()">Hello ${ value }</button>
    <script>
      var value = 'world'

      function click() {
        value = value.split('').reverse().join('')
      }
    </script>
  </body>
</html>
```

你也可以通过 `npm` 并结合工程化工具进行使用

```
npm i -D HtmlComponent
```

---

## 语法

模板语法，与 `js` 一致，没有记忆负担

```html
<div>Hello ${'world'}</div>

<div .title="1 + 1" />

<div if="(bool)" />

<div for="(const item of list)" />

<MyComponent />
```

事件与原生 `DOM0` 一致，不需要额外记忆

```html
<button onclick="console.log(this)" />

<input .value="text" oninput="text=this.value" />
```

看到这里，你就已经基本掌握它了！

以下是更详细一点的介绍

---

## ${ } 插值

与 js \``${}`\` 模板字符串语法一致

文本节点和属性节点都可以，任何变量或表达式你都可以插入

```html
<script>
  let value = 'world'

  const computed = {
    get value() {
      return value.toUpperCase()
    },
  }
</script>

<div title="Hello ${value} !">Hello ${ computed.value } !</div>
```

相当于以下 js

```javascript
div = document.querySelector('div')
div.setAttribute('title', `Hello ${value} !`)
div.innerText = `Hello ${computed.value} !`
```

_`undefined` 不会被输出_

_`object`、`array` 会尝试转为 `json`_

_`$` 可以省略，即 `{value}`_

---

## .property 设置节点的属性

与 js `obj.key`、`obj[key]` 语法一致

以下相当于 js `div.title = text`

```html
<div .title="text">...</div>
```

输出富文本

以下相当于 js `div.innerHTML = html`

_虽然浏览器会强制把 html attribute 名转为小写，但只要是 js dom property 都能自动映射_

```html
<div .innerHTML="html"></div>
```

`this` 指向的是当前节点

你可以访问当前节点的其它 property

```html
<div .title="this.innerText">...</div>
```

将当前节点赋值给一个变量

_`.ref` 可以是任意的 `.property`，只是为了获取当前节点_

```html
<canvas .ref="el = this"></canvas>
```

以下相当于 js `div[property] = value`

_由于 html 限制，这种方式只支持全小写的变量名、不允许有空格_

```html
<div [property]="value">...</div>
```

批量设置属性

以下相当于 js `Object.assign(div, object)`

<!-- 以下相当于 js `Object.assign(div, {...object})` -->

```html
<div ...="object"></div>
```

---

## if 条件节点

与 js `if`、 `else if`、 `else` 语法一致

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

_括号可省略_

---

## for 循环节点

与 js `for..in`、 `for..of` 语法一致

```html
<ul>
  <li for="(var key in object)">{object[key]}</li>
</ul>
```

```html
<ul>
  <li for="(const item of array)" onclick="alert(item)">{item}</li>
</ul>
```

_括号可省略_

_如果你习惯这种写法 `(item, key?, index?) in list` 也可以_

_跟 label 标签的 for 属性同名，但是它们的语法不同，所以并不冲突_

_如果同一节点 `for` + `if` 同时存在，`for` 先于 `if` 运行，跟书写顺序无关。如果要过滤数据，建议在 js 层处理_

---

## on 事件

与原生 `DOM0` 语法一致，`this` 指向的是当前节点，并且有一个名为 `event` 的事件变量，它接受的是要执行的代码

```html
<button onclick="console.log(this, event)">button</button>
```

`.property` 语法一样可以注册事件，它接受的是函数

以下相当于 js `button.onclick = alert`

```html
<button .onclick="alert">button</button>
```

---

## .property + on 双向绑定

`.value` + `oninput` 实现双向绑定

```html
<input .value="text" oninput="text=this.value" />
```

输入 `Number` 类型

```html
<input .value="number" oninput="number=Number(this.value)||0" />
```

`contenteditable` + `.innerText` + `oninput` 任何元素都可以实现双向绑定

```html
<div
  contenteditable="true"
  .innerText="text"
  oninput="text=this.innerText"
></div>
```

---

## is 组件

把 `html` 当成组件，每一个组件实例都有独立的作用域

```html
<!-- MyComponent.html -->
<script>
  let value = 'defaultValue'
  let log = console.log
</script>

<div .onclick="log">${value}</div>
```

通过 `.property` 语法给子组件的内部变量赋值。你可以传任何值，包括函数，这样它们就有了双向通信的能力

```html
<!-- App.html -->
<script>
  import MyComponent from './MyComponent.html'
</script>

<main>
  <div is="MyComponent" .log="alert"></div>

  <!-- 或者 -->
  <MyComponent ...="{value:'myValue'}"></MyComponent>
</main>
```

`self` 指向当前组件实例，那么 `self.constructor` 则是当前组件的类（构造函数）

`is="self.constructor"` 实现递归

注意要有终止条件，避免死循环

```html
<script>
  let number = 10
</script>

<main>
  <div>${number}</div>
  <div if="number" is="self.constructor" .number="number-1" />
</main>
```
