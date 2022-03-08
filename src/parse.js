export default function parse(html) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  return wrapper
}
