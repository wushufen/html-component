# html-component

<a href="./README.md">English</a> | 中文

一个 `html` 增强框架

特点：

- `html` 组件化、双向绑定
- 高性能，不使用数据劫持，不使用虚拟 DOM
- 完全的 `js` 能力，不用改变编程习惯
- 模板语法与 `js` 一致，没有记忆负担
- 简单易上手，掌握只需 `3` 分钟

<a href="https://wushufen.github.io/test/performance/performance.html">性能测试</a>

---

## 体验

<a href="https://wushufen.github.io/html-component/editor.html?code=%3Cbutton+onclick%3D%22count%2B%2B%22%3E%0A++count%3A++%24%7Bcount%7D%0A%3C%2Fbutton%3E%0A%0A%3Cscript%3E%0A++let+count+%3D+0%0A%3C%2Fscript%3E%0A">马上试试</a>

```html
<button onclick="count++">count: ${count}</button>

<script>
  let count = 0
</script>
```

例子：

- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/helloWorld.html">Hello world</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/time.html">时间</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/counter.html">计数器</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/innerHTML.html">富文本</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/listSort.html">列表排序</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/towWayBinding.html">双向绑定</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/style.html">样式</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/snowflake.html">雪花飘飘</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/svg.html">SVG</a>

---

## 安装

通过 `<script>` 标签引入，即可让 `html` 拥有数据绑定和自动更新视图的能力

```html
<script
  type="module"
  src="https://wushufen.github.io/html-component/src/index.js"
></script>
```

你也可以通过 `npm` 并结合工程化工具进行使用

```
npm i -D @wushufen/html-component
```

---

## 语法

- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/syntax.html">语法</a>

<!-- prettier-ignore -->
```html
模板语法 html                                    编译后 js

<!-- ${} 插值 -->
<div>Hello ${'world'}</div>                     div.childNodes[0].nodeValue = `Hello ${'world'}`
<div attr="Hello ${'world'}"></div>             div.setAttribute('attr', `Hello ${'world'}`)

<!-- .prop 属性 -->
<div .prop="1 * 1"></div>                       div.prop = 1 * 1
<div [prop]="1 + 1"></div>                      div[prop] = 1 + 1
<div ...="{prop: 1, [prop]: 2}"></div>          ...{prop: 1, [prop]: 2}

<!-- if 条件 -->
<div if="(bool)"></div>                         if (bool) { }
<div else if="(bool)"></div>                    else if (bool) { }
<div else></div>                                else { }

<!-- for 循环 -->
<div for="(const item of array)"></div>         for (const item of array) { }
<div for="(var key in object)"></div>           for (var key in object) { }

<!-- on 事件 -->
<div onclick="change(event, this)">dom0</div>   div.onclick = function(event){ change(event, this) }
<div .onclick="console.log">.prop</div>         div.onclick = console.log

<!-- .prop + on 双向绑定 -->
<input .value="text" oninput="text=this.value"> input.value = text
                                                input.oninput = function(event){ text=this.value }

<!-- 使用组件 -->
<User .a="1" ...="{b: 2}"></User>               new User({props:{a: 1, ...{b: 2}}})


<!-- 当前组件的变量和全局变量都可以在模板中作用 -->
<script>
  import User from './User.html'

  // 任意的数据类型
  var bool = true
  let text = 'world'
  const prop = 'title'
  const object = { a: 1, b: 2 }
  const array = [1, 2, 3, 4, 5]

  // 没有限制的数据更新方式
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

看到这里，你就已经基本掌握它了！

---

## 文档

<a href="./DOC.zh-CN.md">详细介绍</a>
