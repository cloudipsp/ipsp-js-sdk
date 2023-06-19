const { isArray, isFunction, hasProp, forEach } = require('./utils')
const PENDING = 0
const RESOLVED = 1
const REJECTED = 2

const asyncCallback = (window.asyncCallback = (() => {
    let head = {},
        tail = head
    const id = Math.random()
    window.addEventListener('message', (ev) => {
        if (ev.data !== id) return
        head = head.next
        let fn = head.fn
        delete head.fn
        fn()
    })
    return (fn) => {
        tail = tail.next = { fn }
        window.postMessage(id, '*')
    }
})())

/**
 * @name Deferred
 * @param [fn]
 * @return {Deferred}
 */
exports.Deferred = function Deferred(fn) {
    const doneFuncs = []
    const failFuncs = []
    const progressFuncs = []
    let status = PENDING
    let resultArgs = null
    /**
     * @lends Deferred.prototype
     */
    const promise = {
        done(fn) {
            if (status === RESOLVED) {
                fn.apply(this, resultArgs)
            }
            doneFuncs.push(fn)
            return this
        },
        fail(fn) {
            if (status === RESOLVED) {
                fn.apply(this, resultArgs)
            }
            failFuncs.push(fn)
            return this
        },
        always(fn) {
            return this.done(fn).fail(fn)
        },
        progress(fn) {
            if (status === PENDING) {
                progressFuncs.push(fn)
            }
            return this
        },
        then(done, fail, progress) {
            if (done) {
                this.done(done)
            }
            if (fail) {
                this.fail(fail)
            }
            if (progress) {
                this.progress(progress)
            }
            return this
        },
        promise(object) {
            if (object === null) {
                return promise
            }
            forEach(promise, function (value, name) {
                object[name] = value
            })
            return object
        },
        state() {
            return status
        },
        isPending() {
            return status === PENDING
        },
        isRejected() {
            return status === REJECTED
        },
        isResolved() {
            return status === RESOLVED
        },
    }
    /**
     * @lends Deferred.prototype
     */
    const deferred = {
        resolveWith(context, params) {
            if (status === PENDING) {
                status = RESOLVED
                let args = (resultArgs = params || [])
                for (let i = 0; i < doneFuncs.length; i++) {
                    doneFuncs[i].apply(context, args)
                }
            }
            return this
        },
        rejectWith(context, params) {
            if (status === PENDING) {
                status = REJECTED
                let args = (resultArgs = params || [])
                for (let i = 0; i < failFuncs.length; i++) {
                    failFuncs[i].apply(context, args)
                }
            }
            return this
        },
        notifyWith(context, params) {
            if (status === PENDING) {
                let args = (resultArgs = params || [])
                for (let i = 0; i < progressFuncs.length; i++) {
                    progressFuncs[i].apply(context, args)
                }
            }
            return this
        },
        resetState() {
            status = PENDING
            return this
        },
        resolve() {
            return this.resolveWith(this, arguments)
        },
        reject() {
            return this.rejectWith(this, arguments)
        },
        notify() {
            return this.notifyWith(this, arguments)
        },
    }
    const obj = promise.promise(deferred)
    if (isFunction(fn)) {
        fn.call(obj, obj)
    }
    return obj
}
