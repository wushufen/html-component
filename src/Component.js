/*

for_(id, list, function(item, key, index){
  if_(id, key)
  prop_(id, 'name', key)
})

*/
class Component{
  constructor() {
    this.nodeMap = {}
  }
  saveNode(node, id) {
    id = id || Math.random()
    this.nodeMap[id] = node
    return id
  }
  getNode(id) {
    return this.nodeMap[id]
  }
  $(id) {
    return this.getNode(id)
  }
  for(){}
  if(){}
  prop() {}
  compile(tpl) {
    
  }
}


var app = new Component
