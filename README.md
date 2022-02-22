# HtmlComponent

一个简单的前端框架，化繁为简。

你不用记复杂的概念，只要一分钟就能上手。

你只需要记四个模板语法 `if`、 `for`、 `{value}`、 `.property`，

其它的你只需要按照标准的 `html` 和 `js` 来写。

它的语法非常简单，但是它和其它 `mv*` 框架一样很强大。

你不用关心如何更新视图，它会自动帮你处理。

<!-- ## name

- fool
- esy -->

# 语法

## {value} 插值

文本节点和属性节点都可以

```html
<script>
  var value = 'world'
</script>
<div title="Hello {value}!">Hello {value}!</div>
```

## .property 设置节点的属性

相当于 js `el.property = value`

```html
<div .title="value">{value}</div>
```

它还可以这样

```html
<pre .innerHTML="value"></pre>
```

## if 条件控制

```html
<div if="(value)">Hello</div>
```

## for 循环

语法跟 js `for..in`、 `for..of` 是一样的

```html
<ul>
  <li for="(var key in value)">{value[key]}</li>
</ul>
```

```html
<ul>
  <li for="(const item of value)">{item}</li>
</ul>
```

## on 事件

原生怎么写就怎么写

注： dom0 中的 `this` 指向的是当前节点，并且有一个名字 `event` 的事件变量

```html
<!-- dom0 -->
<button onclick="value='value2'; console.log(event)">{value}</button>
```

很明显 `.property` 一样可以注册事件

```html
<!-- .property -->
<button .onclick="console.log">button</button>
```

`oninput` + `.value` 实现双向绑定

```html
<!-- 双向绑定 -->
<input oninput="value = this.value" .value="value" />
```

## component 组件

```html
<!-- App.html -->
<script>
  import Com from './Com.html'
  var myValue = 'my value1'
</script>

<Com .value="myValue"></Com>
<div is="Com" .value="'my value2'"></div>
```

```html
<!-- Com.html -->
<script>
  var value = 'default value'
</script>

<div>{value}</div>
```
