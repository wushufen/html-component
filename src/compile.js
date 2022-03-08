import parse from './parse'

function compile(tpl) {
  let node = tpl
  if (tpl.nodeType === 1) {
    node = parse(tpl)
  }

}
