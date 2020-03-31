class BZ {
  constructor(options) {
    this.$options = options
    if (options.data) {
      initData(this)
    }
    if (options.computed) {
      initComputed(this)
    }
  }
}
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: function() {},
  set: function() {}
}

let watcherId = 0
class Watcher {
  constructor(vm, expression) {
    this.vm = vm
    this.deps = []
    this.depIds = new Set()
    this.getter = expression
    this.id = ++watcherId
    this.dirty = true // 是否为脏值（依赖项是否改变）
    this.lazy = true // 是否惰性计算
    this.value = this.lazy ? undefined : this.get()
  }
  get() {
    pushTarget(this) // 将正在执行计算的watcher放入到Dep.target中
    const vm = this.vm
    let value = this.getter.call(vm, vm)
    popTarget() // 从Dep.target中移除
    return value
  }
  addDep(dep) { // 将此watcher添加到data的dep依赖中
    if (!this.depIds.has(dep.id)) {
      this.deps.push(dep)
      this.depIds.add(dep.id)
      dep.addSub(this)
    }
  }
  update() { // data数据发生变化时，修改脏值判断
    this.dirty = true
  }
  evaluate() { // 如果脏值判断为true，则从新计算，并修改脏值状态
    this.value = this.get()
    this.dirty = false
  }
}

let depId = 0
class Dep {
  constructor() {
    this.subs = []
    this.id = depId++
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  notify() {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
Dep.target = null


const targetStack = []

function pushTarget(_target) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

function popTarget() {
  Dep.target = targetStack.pop()
}

function proxy(target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
function initData(vm) {
  let data = getData(vm.$options.data)
  vm._data = data
  // 将data代理到vm属性下，便于直接访问
  Object.keys(data).forEach(key => {
    proxy(vm, '_data', key)
  })
  observe(data, vm)
}

function initComputed(vm) {
  let computeds = vm.$options.computed
  const watchers = (vm._computedWatchers = Object.create(null))
  let keys = Object.keys(computeds)
  keys.forEach(key => {
    const expression = computeds[key]
    let getter = typeof expression === 'function' ? expression : expression.get
    watchers[key] = new Watcher(vm, getter) // 添加到vm下的watchers
    if (!(key in vm._data)) {
      difineComputed(vm, key, expression)
    }
  })
}

function difineComputed(vm, key, expression) {
  Object.defineProperty(vm, key, {
    get() {
      const watcher = this._computedWatchers && this._computedWatchers[key]
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate()
        }
        return watcher.value
      }
    },
    set() {}
  })
}

function getData(dataFunc, vm) {
  try {
    return dataFunc.call(vm, vm)
  } catch (e) {
    console.log(e)
    return {}
  }
}

class Observer {
  constructor(data) {
    let keys = Object.keys(data)
    keys.forEach(item => {
      defineReactive(data, item, data[item])
    })
  }
}
// 设置getter, setter
function defineReactive(data, key, value) {
  observe(value) // 深度劫持
  const dep = new Dep()
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (Dep.target) {
        dep.depend()
      }
      return value
    },
    set(newVal) {
      if (newVal === value) {
        return
      }
      value = newVal
      observe(newVal) // 如果是对象则劫持新赋值的值
      dep.notify()
    }
  })
}

function observe(data) {
  if (typeof data === 'object' && !(data instanceof Array)) {
    return new Observer(data)
  }
}

let bm = new BZ({
  data() {
    return {
      a: 1,
      b: 2
    }
  },
  computed: {
    c() {
      console.log('C收集依赖')
      return this.a + this.b
    },
    d() {
      console.log('D收集依赖')
      return this.b + "D"
    }
  }
})

console.log(bm.c, bm.d)
console.log(bm.c, bm.d)
console.log(bm.c, bm.d) // 多次打印，但是只执行了一次表达式，符合结果缓存特点
bm.a = 6 // 修改其依赖项
console.log(bm.c, bm.d) // C的依赖项发生了改变，则C从新执行了表达式

