import Component from './Component.js'
import loader from './loader.js'

/**
 *
 * @param {string} url
 * @returns {Component}
 */
Component.loader = async function (url) {
  const html = await (await fetch(new URL(url, Component.loader.base))).text()
  const fileName = url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))

  Component.loader.base = url
  return loader(html, fileName)
}
Component.loader.base = location.href

export default Component.loader
export { Component }
