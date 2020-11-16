class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        this.oldVal = this.getOldVal()
    }

    getOldVal() {
        Dep.target = this
        const oldVal = compileUtil.getVal(this.expr, this.vm)
        Dep.target = null
        return oldVal
    }
    update() {
        const newVal = compileUtil.getVal(this.expr, this.vm)
        if (newVal !== this.oldVal) {
            this.cb(newVal)
        }
    }
}

class Dep {
    constructor() {
        this.subs = []
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        console.log('观察者：：', this.subs)
        this.subs.forEach(w => w.update())
    }
}

class Observer {
    constructor(data) {
        this.observer(data)
    }

    observer(data) {
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key])
            })
        }
    }

    defineReactive(data, key, value) {
        this.observer(value)
        const dep = new Dep()
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get() {
                // 订阅数据变化时 往Dep里添加观察者
                Dep.target && dep.addSub(Dep.target)
                return value;
            },
            set: (newVal) => {
                this.observer(newVal)
                if (newVal && newVal !== value) {
                    value = newVal
                }
                dep.notify()
            }
        })
    }
}