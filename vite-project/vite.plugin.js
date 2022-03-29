// import { loader } from './loader.js'

const fileRegex = /\.(html)$/

export default function myPlugin() {
  return {
    name: 'component.html.loader',

    transform(src, id) {
      if (fileRegex.test(id)) {
        return {
          code: `
import loader from "../../src/loader.js";
var html = \`
${src.replace(/[`\\$]/g, '\\$&')}
\`
export default loader(html)
`,
          map: null, // 如果可行将提供 source map
        }
      }
    },
  }
}
