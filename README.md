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
    <button onclick="click()">Hello { value } !</button>
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

## {value} 插值

文本节点和属性节点都可以，任何变量或表达式你都可以插入

```html
<script>
  var value = 'world'

  function upper(string) {
    return string.toUpperCase()
  }
</script>

<h1 title="Hello {value} !">Hello { upper(value) } !</h1>
```

---

## .property 设置节点的属性

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
<div .title="this.innerText">text</div>
```

你可以把当前节点传给一个变量

```html
<canvas .ref="el = this">text</canvas>
```

_实际上 `.ref` 可以是任意的 `.property`，只是为了获取当前节点_

---

## on 事件

就是原生的语法，跟 `DOM0` 一致，`this` 指向的是当前节点，并且有一个名为 `event` 的事件变量

它接受的是要执行的代码，你不应把过多逻辑写在这里

```html
<a onclick="event.preventDefault(); console.log(this, event)">...</a>
```

`.property` 语法一样可以注册事件，它接受的是函数

以下相当于 js `button.onclick = window.alert`

```html
<button .onclick="window.alert">button</button>
```

```html
<button .value="value" .oninput="()=> value=this.value">button</button>
```

所以注册事件并不需要额外的记忆

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

## if 条件节点

语法跟 js `if`、 `else if`、 `else` 一致

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

---

## for 循环节点

语法跟 js `for..in`、 `for..of` 一致

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

_跟 label 标签的 for 属性同名，但是它们的语法不同，所以并不冲突_

_如果同一节点 `for` + `if` 同时存在，`for` 先于 `if` 运行，跟书写顺序无关。如果要过滤数据，建议在 js 层处理_

---

## is 组件

把 `html` 当成组件。每一个组件实例都有独立的作用域

```html
<!-- App.html -->
<script>
  import Com from './Com.html'
  var myValue = 'myValue'
</script>

<div>
  <div is="Com" .value="myValue"></div>
  <!-- 或者 -->
  <Com .value="'myValue2'"></Com>
</div>
```

```html
<!-- Com.html -->
<script>
  var value = 'defaultValue'
</script>

<div>{value}</div>
```

通过 `.property` 语法传值，更新子组件的内部变量。你可以传任何值，包括函数，这样它们就有了双向通信的能力
