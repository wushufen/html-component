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

## ${ } 插值

与 js \``${}`\` 模板字符串语法一致

文本节点和属性节点都可以，任何变量或表达式你都可以插入

```html
<script>
  var value = 'world'

  function upper(string) {
    return string.toUpperCase()
  }
</script>

<h1 title="Hello ${value} !">Hello { upper(value) } !</h1>
```

_`$` 可以省略，即 `{value}`_

---

## .property 设置节点的属性

与 js `obj.key`、`obj[keyName]` 语法一致

以下相当于 js `div.title = value`

```html
<div .title="value">...</div>
```

你可以这样输出富文本。以下相当于 js `pre.innerHTML = value`

```html
<pre .innerHTML="value"></pre>
```

`this` 指向的是当前节点

```html
<div .title="this.innerText">...</div>
```

你可以把当前节点传给一个变量

_`.ref` 可以是任意的 `.property`，只是为了获取当前节点_

```html
<canvas .ref="el = this"></canvas>
```

以下相当于 js `div[property] = value`

_由于 html 限制只支持全小写的变量名、不允许有空格_

```html
<div [property]="value">...</div>
```

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
<a onclick="event.preventDefault(); console.log(this, event)">...</a>
```

`.property` 语法一样可以注册事件，它接受的是函数

以下相当于 js `button.onclick = window.alert`

```html
<button .onclick="window.alert">button</button>
```

---

## .property + on 双向绑定

`.value` + `oninput` 实现双向绑定。没有语法糖，但更新清楚它发生了什么

```html
<input .value="value" oninput="value=this.value" />
```

输入 `Number` 类型，你可以非常灵活

```html
<input .value="value" oninput="value=Number(this.value)||0" />
```

`contenteditable` + `.innerText` + `oninput` 任何元素你都可以实现双向绑定

```html
<div
  contenteditable="true"
  .innerText="value"
  oninput="value=this.innerText"
></div>
```

---

## is 组件

把 `html` 当成组件。每一个组件实例都有独立的作用域

```html
<!-- App.html -->
<script>
  import Com from './Com.html'
</script>

<main>
  <div is="Com" .log="alert"></div>

  <!-- 或者 -->
  <Com ...="{value:'myValue'}"></Com>
</main>
```

```html
<!-- Com.html -->
<script>
  var value = 'defaultValue'
  var log = console.log
</script>

<div .onclick="log">{value}</div>
```

通过 `.property` 语法传值，更新子组件的内部变量。你可以传任何值，包括函数，这样它们就有了双向通信的能力
