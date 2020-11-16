

const compileUtil = {// 策略模式
    getVal(expr, vm) {
        //从vm.data里面取出真实的值
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal]
        }, vm.$data)
    },
    setVal(expr, vm, inputVal) {
        //从vm.data里面取出真实的值
        console.log(expr, vm)
        return expr.split('.').reduce((data, currentVal) => {
            data[currentVal] = inputVal
        }, vm.$data)
    },
    getContentVal(expr, vm) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(args[1], vm)
        })
    },
    text(node, expr, vm) {// expr: msg  <div v-text="person.hobby"></div>
        let value
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Watcher(vm, args[1], () => {
                    console.log('getcontentval::', this.getContentVal(expr, vm))
                    this.updater.textUpdater(node, this.getContentVal(expr, vm))

                })
                return this.getVal(args[1], vm)
            })
        } else {
            //绑定观察者 以便将来数据变化后更新
            new Watcher(vm, expr, (newVal) => {
                this.updater.textUpdater(node, newVal)

            })
            value = this.getVal(expr, vm)
        }
        this.updater.textUpdater(node, value)
    },
    html(node, expr, vm) {
        const value = this.getVal(expr, vm)
        // 数据变化 -》 更新视图
        new Watcher(vm, expr, (newVal) => {
            this.updater.htmlUpdater(node, value)

        })


        this.updater.htmlUpdater(node, value)
    },
    model(node, expr, vm) {
        const value = this.getVal(expr, vm)
        new Watcher(vm, expr, (newVal) => {
            this.updater.modelUpdater(node, newVal)

        })
        //输入框的内容变化 -》更新数据
        node.addEventListener('input', e => {
            this.setVal(expr, vm, e.target.value)
        })
        this.updater.modelUpdater(node, value)
    },
    on(node, expr, vm, eventName) {
        const fn = vm.$options.methods && vm.$options.methods[expr]
        node.addEventListener(eventName, fn.bind(vm), false)
    },

    updater: {
        modelUpdater(node, value) {
            node.value = value
        },
        htmlUpdater(node, value) {
            node.innerHTML = value
        },
        textUpdater(node, value) {
            node.textContent = value
        }
    }
}

class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm

        //1. 获取文档碎片对象 放入内存中会减少页面的回流和重绘
        const fragment = this.node2Fragment(this.el)
        console.log(fragment)

        //2. 编译模板
        this.compile(fragment)

        // 3.
        this.el.append(fragment)


    }
    compile(fragment) {
        const childNodes = fragment.childNodes

        Array.from(childNodes).forEach(child => {
            if (this.isElementNode(child)) {
                // 元素节点 编译元素节点
                this.compileElement(child)
            } else {
                // 编译文本节点
                console.log(child)
                this.compileText(child)

            }
            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        });
    }
    compileElement(node) {
        const attributes = node.attributes
        Array.from(attributes).forEach(attr => {
            const { name, value } = attr
            if (this.isDirective(name)) {
                //是一个指令
                const [, directive] = name.split('-')
                const [dirName, eventName] = directive.split(':')
                compileUtil[dirName](node, value, this.vm, eventName)

                node.removeAttribute('v-' + directive)

            } else if (this.isEventName(name)) {
                //处理 @click
                let [, eventName] = name.split('@')
                compileUtil['on'](node, value, this.vm, eventName)
            }
        })
    }
    compileText(node) {
        // {{}} 处理
        const content = node.textContent
        console.log(content)
        if (/\{\{(.+?)\}\}/.test(content)) {
            compileUtil['text'](node, content, this.vm)
        }
    }
    isEventName(attrname) {
        return attrname.startsWith('@')
    }
    isDirective(attrName) {
        return attrName.startsWith('v-')
    }
    node2Fragment(el) {
        const f = document.createDocumentFragment()
        let firstChild
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }
    isElementNode(node) {
        return node.nodeType === 1
    }
}
class MVue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options
        if (this.$el) {
            //1. 实现一个数据观察者
            new Observer(this.$data)
            //2. 实现一个指令解析器
            new Compile(this.$el, this)

            //3.get this.$data添加代理
            this.proxyData(this.$data)
        }
    }
    proxyData(data) {
        for (const key in data) {
            Object.defineProperty(this, key, {
                get() {
                    return data[key]
                },
                set(newVal) {
                    data['key'] = newVal
                }
            })
        }
    }

}