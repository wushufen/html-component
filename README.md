# HtmlComponent

一个语法简单但是功能强大的 `mvvm` 框架，它赋予了 `html` 自动更新视图和组件化的能力。

它的目标是增强 `html` 而不是创造一门语言，你一分钟就能掌握它。

---

## 安装

通过 `<script>` 标签引入，即可让 `html` 拥有数据绑定和自动更新视图的能力

```html
<html>
  <head>
    <script src="../src/HtmlComponent.js"></script>
  </head>

  <body>
    <button onclick="change()">Hello ${ value }</button>

    <script>
      var value = 'world'

      function change() {
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

<!-- prettier-ignore -->
```html
模板语法 html                               相当于 js

<!-- ${} 插值 -->
<div>Hello ${'world'}</div>               div.innerText = `Hello ${'world'}`
<div attr="Hello ${'world'}" />           div.setAttribute('attr', `Hello ${'world'}`)


<!-- .property 赋值 -->
<div .prop="1 + 1" />                     div.prop = 1 + 1
<div [key]="1 + 1" />                     div[key] = 1 + 1
<div ...="{prop1: 1, prop2: 2}" />        { ...{prop1: 1, prop2: 2} }


<!-- if 条件 -->
<div if="(bool)" />                       if (bool) { }
<div else if="(bool)" />                  else if (bool) { }
<div else />                              else { }


<!-- for 循环 -->
<div for="(const item of array)" />       for (const item of array) { }
<div for="(var key in object)" />         for (var key in object) { }


<!-- on 事件 -->
<div onclick="change(this, event)" />     div.onclick = function(event){ change(this, event) }
<div .onclick="console.log" />            div.onclick = console.log


<!-- .property + on 双向绑定 -->
<input .value="text" oninput="text=this.value" />
                                          input.value = text
                                          input.oninput = function(event){ text=this.value }

<!-- is 组件 -->
<!-- <el is="MyComponent" /> = <MyComponent /> -->
<MyComponent .a="1" ...="{b: 2, c: 3}" /> if(!created) myComponent = new MyComponent()
                                          myComponent.render({a: 1, ...{b: 2, c: 3}})


模板可以访问所有当前组件定义的变量和全局变量
修改组件变量后视图会自动更新
通过 `.property` 语法可以给子组件变量赋值

<script>
  import MyComponent from './MyComponent.html'

  var bool = true
  let text = 'world'
  const key = 'title'
  const object = {}
  const array = []

  function  change() {
    // 不同于其它框架，本框架更新变量的方式没有任何限制，没有记忆负担
    bool = !bool
    object.key = 'value'
    array.length = 10
    array.fill(Math.random())
    array[2] = 2
  }
</script>
```

看到这里，你就已经基本掌握它了！

以下是详细介绍

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

<div title="Hello ${value} !">Hello ${computed.value} !</div>
```

相当于以下 js

```javascript
div.setAttribute('title', `Hello ${value} !`)
div.innerText = `Hello ${computed.value} !`
```

_`undefined` 不会被输出_

_`object`、`array` 会尝试转为 `json`_

_`$` 可以省略，即 `{value}`_

---

## .property 赋值

与 js `obj.key`、`obj[key]` 语法一致

以下相当于 js `div.title = text`

```html
<div .title="text">...</div>
```

输出富文本

以下相当于 js `div.innerHTML = html`

_虽然浏览器会强制把 html attribute 名转为小写，但只要是 js dom property 本框架做了自动映射_

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

_由于 html 限制，这种方式只支持全小写的变量名、不允许有空格。可以用下面的方式代替_

```html
<div [property]="value">...</div>
```

批量设置属性

以下相当于 js `Object.assign(div, object)`

```html
<div ...="object"></div>
```

以下相当于 js `Object.assign(div, { [property]: value })`

```html
<div ...="{ [property]: value }"></div>
```

---

## if 条件

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

## for 循环

与 js `for..in`、 `for..of` 语法一致

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

相当于以下 js

```javascript
// Model -> View
input.value = text

// View -> Model
input.oninput = function (event) {
  text = this.value
}
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

`self` 指向的是当前组件实例，那么 `self.constructor` 则是当前组件的类（构造函数）

`is="self.constructor"` 可以实现递归，注意要有终止条件，避免死循环

```html
<script>
  let number = 10
</script>

<main>
  <div>${number}</div>
  <div if="number" is="self.constructor" .number="number-1" />
</main>
```

---

## 总结

模板语法跟 `js` 是一致的，相当于把 `js` 的能力扩展到 `html`，只要你会 `js` 看一遍就能记住它所有语法

<!-- prettier-ignore -->
```html
模板语法 html                                相当于 js

<div>Hello ${'world'}</div>                 div.innerText = `Hello ${'world'}`

<div attr="Hello ${'world'}" />             div.setAttribute('attr', `Hello ${'world'}`)


<div .prop="1 + 1" />                       div.prop = 1 + 1

<div [key]="1 + 1" />                       div[key] = 1 + 1

<div ...="{prop1: 1, prop2: 2}" />          { ...{prop1: 1, prop2: 2} }


<div if="(bool)" />                         if (bool) { }

<div else if="(bool)" />                    else if (bool) { }

<div else />                                else { }


<div for="(var key in object)" />           for (var key in object) { }

<div for="(const item of array)" />         for (const item of array) { }


<div onclick="console.log(this, event)" />  div.onclick = function(event){ console.log(this, event) }

<div .onclick="alert" />                    div.onclick = alert


<MyComponent .a="1" ...="{b: 2}" />         (myComponent||new MyComponent()).render({a: 1,...{b: 2}})


模板中可以访问当前组件定义的所有变量和全局变量，修改组件变量视图会自动更新

通过 `.property` 语法可以修改子组件变量

<script>
  import MyComponent from './MyComponent.html'

  var bool = true
  const key = 'title'
  let object = {}
  const array = []
</script>
```
