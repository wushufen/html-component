# html-component

<a href="./README.md">English</a> | 中文

一个 `html` 增强框架

特点：

- `html` 组件化、双向绑定
- 高性能，不使用数据劫持，不使用虚拟 DOM
- 完全的 `js` 能力，不用改变编程习惯
- 模板语法与 `js` 一致，没有记忆负担
- 简单易上手，掌握只需 `3` 分钟

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

- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Ch1%3E%0A++Hello+%24%7B%27world%27%7D+%21%0A%3C%2Fh1%3E">Hello world</a>
- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Ch1%3E%0A++%24%7Bdate.toLocaleString%28%29%7D%0A++%3Csmall%3E%24%7Bdate.getMilliseconds%28%29%7D%3C%2Fsmall%3E%0A%3C%2Fh1%3E%0A%0A%3Cscript%3E%0A++let+date+%3D+new+Date%0A%0A++setInterval%28%28%29%3D%3E%7B%0A++%09date+%3D+new+Date%0A++%7D%29%0A%3C%2Fscript%3E%0A">时间</a>
- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Cbutton+onclick%3D%22count%2B%2B%22%3E%0A++count%3A++%24%7Bcount%7D%0A%3C%2Fbutton%3E%0A%0A%3Cscript%3E%0A++let+count+%3D+0%0A%3C%2Fscript%3E%0A">计数器</a>
- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Ccode%3E%24%7Bhtml%7D%3C%2Fcode%3E%0A%0A%3Coutput+.innerHTML%3D%22html%22%3E%3C%2Foutput%3E%0A%0A%3Cscript%3E%0A++let+html+%3D+%27%3Cbutton%3Ebutton%3C%2Fbutton%3E%27%0A%3C%2Fscript%3E%0A%0A%3Cstyle%3E%0A++code+%7B%0A++++background%3A+%23000%3B%0A++++color%3A+%230ff%3B%0A++++padding%3A+.25em%3B%0A++++border-radius%3A+.25em%3B%0A++%7D%0A%3C%2Fstyle%3E">富文本</a>
- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Cbutton+onclick%3D%22add%28%29%22%3E%2B%3C%2Fbutton%3E%0A%3Cbutton+onclick%3D%22del%28%29%22%3E-%3C%2Fbutton%3E%0A%3Cbutton+onclick%3D%22list.sort%28%28a%2C+b%29+%3D%3E+a+-+b%29%22%3Esort%3C%2Fbutton%3E%0A%3Cbutton+.onclick%3D%22shuffle%22%3Eshuffle%3C%2Fbutton%3E%0A%0A%3Col%3E%0A++%3Cli+for%3D%22const+item+of+list%22+onclick%3D%22del%28item%29%22%3E%24%7Bitem%7D%3C%2Fli%3E%0A%3C%2Fol%3E%0A%0A%3Cscript%3E%0A++const+list+%3D+%5B1%2C+3%2C+5%2C+7%2C+9%2C+2%2C+4%2C+6%2C+8%2C+10%5D%0A%0A++function+add%28%29+%7B%0A++++list.splice%28random%28%29%2C+0%2C+Math.max%28...list%2C+0%29+%2B+1%29%0A++%7D%0A%0A++function+del%28item%29+%7B%0A++++list.splice%28item+%3F+list.indexOf%28item%29+%3A+random%28%29%2C+1%29%0A++%7D%0A%0A++function+shuffle%28%29+%7B%0A++++list.sort%28%28_%29+%3D%3E+Math.random%28%29+-+0.5%29%0A++%7D%0A%0A++function+random%28max+%3D+list.length%29+%7B%0A++++return+%28Math.random%28%29+*+max%29+%7C+0%0A++%7D%0A%3C%2Fscript%3E%0A%0A%3Cstyle%3E%0A++*+%7B%0A++++border-color%3A+%23ddd%3B%0A++++user-select%3A+none%3B%0A++++border-radius%3A+5px%3B%0A++%7D%0A%0A++button+%7B%0A++++min-width%3A+2em%3B%0A++++height%3A+2em%3B%0A++++border-radius%3A+9em%3B%0A++++border%3A+solid+1px+%23bbb%3B%0A++%7D%0A%0A++button%3Aactive+%7B%0A++++transform%3A+scale%280.9%29%3B%0A++%7D%0A%0A++ul%2C%0A++ol+%7B%0A++++max-width%3A+375px%3B%0A++++padding%3A+0+3ex%3B%0A++%7D%0A%0A++li+%7B%0A++++position%3A+relative%3B%0A++++margin-bottom%3A+-1px%3B%0A++++border%3A+solid+1px+%23bbb%3B%0A++++padding%3A+0.25em+0.5em%3B%0A++%7D%0A%3C%2Fstyle%3E%0A">列表排序</a>
- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Cscript%3E%0A++let+value+%3D+%27hello+world%27%0A++const+array+%3D+%5B1%2C+2%2C+3%5D%0A%3C%2Fscript%3E%0A%0A%3Cform%3E%0A++%3Cinput+.value%3D%22value%22+oninput%3D%22value%3Dthis.value%22+%2F%3E%0A%0A++%3Cinput%0A++++type%3D%22number%22%0A++++.value%3D%22Number%28value%29%7C%7C0%22%0A++++oninput%3D%22value%3DNumber%28this.value%29%7C%7C0%22%0A++%2F%3E%0A%0A++%3Cinput%0A++++type%3D%22range%22%0A++++max%3D%225%22%0A++++.value%3D%22value%22%0A++++oninput%3D%22value%3DNumber%28this.value%29%7C%7C0%22%0A++%2F%3E%0A%0A++%3Ctextarea+.value%3D%22value%22+oninput%3D%22value%3Dthis.value%22%3E%3C%2Ftextarea%3E%0A%0A++%3Cdiv%0A++++contenteditable%3D%22true%22%0A++++.innerText%3D%22value%7C%7C%27contenteditable%27%22%0A++++oninput%3D%22value%3Dthis.innerText%22%0A++%3E%3C%2Fdiv%3E%0A%0A++%3Cselect+oninput%3D%22value+%3D+this.value%22%3E%0A++++%3Coption%3E--%3C%2Foption%3E%0A++++%3Coption%0A++++++for%3D%22const+item+of+array%22%0A++++++.value%3D%22item%22%0A++++++.selected%3D%22this.value+%3D%3D+value%22%0A++++%3E%0A++++++%7Bitem%7D%0A++++%3C%2Foption%3E%0A++%3C%2Fselect%3E%0A%0A++%3Cfieldset%3E%0A++++%3Clabel%3E%0A++++++%3Cinput%0A++++++++type%3D%22radio%22%0A++++++++.value%3D%221+*+1%22%0A++++++++.checked%3D%22this.value+%3D%3D+value%22%0A++++++++onclick%3D%22value%3Dthis.value%22%0A++++++%2F%3E%0A++++++string%0A++++%3C%2Flabel%3E%0A++++%3Clabel%3E%0A++++++%3Cinput%0A++++++++type%3D%22radio%22%0A++++++++.yourprop%3D%22array%22%0A++++++++.checked%3D%22this.yourprop%3D%3D%3Dvalue%22%0A++++++++onclick%3D%22value%3Dthis.yourprop%22%0A++++++%2F%3E%0A++++++any%0A++++%3C%2Flabel%3E%0A++%3C%2Ffieldset%3E%0A%0A++%3Clabel%3E%0A++++%3Cinput+type%3D%22checkbox%22+.checked%3D%22value%22+onclick%3D%22value+%3D+%21value%22+%2F%3E%0A++++checkbox%0A++%3C%2Flabel%3E%0A%0A++%3Coutput%3E+%24%7BJSON.stringify%28value%29%7D+%3C%2Foutput%3E%0A%3C%2Fform%3E%0A%0A%3Cstyle%3E%0A++form+%3E+*+%7B%0A++++box-sizing%3A+border-box%3B%0A++++display%3A+block%3B%0A++++width%3A+300px%3B%0A++++padding%3A+0.25em+0.5em%3B%0A++++border%3A+1px+solid+%23bbb%3B%0A++++border-radius%3A+0.25em%3B%0A++++margin%3A+0.5em+auto%3B%0A++++font-size%3A+14px%3B%0A++%7D%0A%0A++output+%7B%0A++++background%3A+%23000%3B%0A++++color%3A+%230ff%3B%0A++++padding%3A+0.25em%3B%0A++++border%3A+0%3B%0A++++border-radius%3A+0.25em%3B%0A++%7D%0A%3C%2Fstyle%3E%0A">双向绑定</a>
- <a href="https://wushufen.github.io/html-component/editor.html?url=./examples/snowflake.html">雪花飘飘</a>
- <a href="https://wushufen.github.io/html-component/editor.html?code=%3Csvg%3E%0A++%3Crect%0A++++for%3D%22%28item%2Ci%29+in+list%22%0A++++.style%3D%22%7B%0A++++++width%3A+10%2C%0A++++++height%3A+item.height%2C%0A++++++x%3A+i*40%2C%0A++++++y%3A+300+-+item.height%2C%0A++++%7D%22%0A++%2F%3E%0A%3C%2Fsvg%3E%0A%0A%3Cscript%3E%0A++var+list+%3D+Array%2850%29%0A++++.fill%28%29%0A++++.map%28%28e%2C+i%29+%3D%3E+%28this%5Bi%5D+%3D+%7B+height%3A+i+%7D%29%29%0A%0A++function+update%28%29+%7B%0A++++for+%28var+i+%3D+0%3B+i+%3C+list.length%3B+i%2B%2B%29+%7B%0A++++++list%5Bi%5D.height+%3D+Math.random%28%29+*+%28250+-+10%29+%2B+10%0A++++%7D%0A++%7D%0A%0A++setInterval%28update%2C+1000%29%0A%3C%2Fscript%3E%0A%0A%3Cstyle%3E%0A++svg+%7B%0A++++overflow%3A+visible%3B%0A++%7D%0A++rect+%7B%0A++++fill%3A+rgba%280%2C+125%2C+255%2C+0.5%29%3B%0A++++transition%3A+1s%3B%0A++%7D%0A%3C%2Fstyle%3E%0A">SVG</a>

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

<a href="https://wushufen.github.io/html-component/editor.html?code=%3C%21--+%24%7B+%7D+--%3E%0A%3Cdiv%3Etext%3A+Hello+%24%7Btext%7D%3C%2Fdiv%3E%0A%3Cdiv+attr%3D%22Hello+%24%7B%27world%27%7D%22%3Ediv.setAttribute%3C%2Fdiv%3E%0A%0A%3C%21--+.prop+--%3E%0A%3Cdiv+.prop%3D%221+*+1%22%3Ediv.prop%3C%2Fdiv%3E%0A%3Cdiv+%5Bprop%5D%3D%221+%2B+1%22%3Ediv%5Bprop%5D%3C%2Fdiv%3E%0A%3Cdiv+...%3D%22%7Bprop%3A+1%2C+%5Bprop%5D%3A+2%7D%22%3E...%7B+%3Cspan%3Eobj%3C%2Fspan%3E+%7D%3C%2Fdiv%3E%0A%0A%3C%21--+if+--%3E%0A%3Cdiv+if%3D%22%28array%5B0%5D+%25+2%29%22%3Eif%3C%2Fdiv%3E%0A%3Cdiv+else+if%3D%22%28array%5B1%5D+%25+2%29%22%3Eelse+if%3C%2Fdiv%3E%0A%3Cdiv+else%3Eelse%3C%2Fdiv%3E%0A%0A%3C%21--+for+--%3E%0A%3Col%3E%0A++%3Cli+for%3D%22%28const+item+of+array%29%22%3Efor...of%3A+%24%7Bitem%7D%3C%2Fli%3E%0A%3C%2Fol%3E%0A%3Cul%3E%0A++%3Cli+for%3D%22%28var+key+in+object%29%22%3Efor...in%3A+%24%7Bkey%7D%3A+%24%7Bobject%5Bkey%5D%7D%3C%2Fli%3E%0A%3C%2Ful%3E%0A%0A%3C%21--+on+--%3E%0A%3Cbutton+onclick%3D%22change%28event%29%22%3Edom0%3A+onclick%3C%2Fbutton%3E%0A%3Cbutton+.onclick%3D%22change%22%3E.prop%3A+.onclick%3C%2Fbutton%3E%0A%0A%3C%21--+.prop+%2B+on+--%3E%0A%3Cinput+.value%3D%22text%22+oninput%3D%22text%3Dthis.value%22+%2F%3E%0A%0A%3C%21--+script+--%3E%0A%3Cscript%3E%0A++let+text+%3D+%27world%27%0A++const+prop+%3D+%27title%27%0A++const+object+%3D+%7B+a%3A+1%2C+b%3A+2+%7D%0A++const+array+%3D+%5B1%2C+2%2C+3%2C+4%2C+5%5D%0A%0A++function+change%28%29+%7B%0A++++text+%3D+text.slice%281%29+%2B+text%5B0%5D%0A++++object.key+%3D+%27value%27%0A++++array.length+-%3D+1%0A++++array.push%28%28Math.random%28%29+*+10%29+%7C+0%29%0A++++array.sort%28%28a%2C+b%29+%3D%3E+Math.random%28%29+-+0.5%29%0A++%7D%0A%3C%2Fscript%3E%0A">试一下</a>

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
