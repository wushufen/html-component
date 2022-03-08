import parse from './parseHTML.js'

/**
 * ${1}
 * <ul title="${2}" .prop="22" [key]="222" ...="{a:2222}">
 *   <li for="const item of list3" if="item!=3" is="MyComponent" .value="3">
 *     ${4}
 *   </li>
 * </ul>
 * ==>
 * <text id=1/>${1}
 * <ul id=2>
 *   <li id=3>
 *     <text id=4/>${4}
 *   </li>
 * </ul>
 * ==>
 * self.prop(1, 'nodeValue', 1)
 *
 * self.attr(2, 'title', `${2}`)
 * self.prop(2, 'prop', 22)
 * self.prop(2, key, 222)
 * self.prop(2, '..', {a:2222})
 *
 * self.for(3, list3, function(item, $key, $index){
 *   self.if(item!=3, function() {
 *     self.prop(3, 'value', 3)
 *     self.is(3, 'MyComponent')
 *
 *     self.prop(4, 'nodeValue', `${4}`)
 *   })
 * })
 * @param {string} tpl
 */
function compile(tpl) {
  const wrapper = parse(tpl)
  let id = 0
  let code = ''

  loopTree(wrapper)
  function loopTree(node) {
    id++
    console.log(id, node)

    // text: ${}
    if (node.nodeType === 3) {
      if (/\$?\{.*?\}/.test(node.nodeValue)) {
        const text = document.createElement('text')
        text.setAttribute('_id:', id)
        node.parentNode.insertBefore(text, node)

        code += `self.prop(${id}, 'nodeValue', 'TODO')\n`
      }
      return
    }

    // for > if > .prop > is >>> childNodes <<< /if < /for
    node.setAttribute('_id:', id);


    // >>>
    [...node.childNodes].forEach(loopTree)
  }

  console.log(wrapper, wrapper.outerHTML)
  return wrapper
}

const html = `
 \${1}
 <ul title="\${2}" .prop="3" [key]="4" ...="{a:5}">
   <li for="const item of list(6)" if="item!=7">
     \${8}
   </li>
 </ul>
`

compile(html)
