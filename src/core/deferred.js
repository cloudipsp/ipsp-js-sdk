const Utils = require('./utils');

const PENDING = 0;
const RESOLVED = 1;
const REJECTED = 2;

function isArray(value) {
    return Utils.isArray(value);
}

function isFunction(value) {
    return Utils.isFunction(value);
}

function forEach(list, callback, context) {
    if (list) {
        if (isArray(list)) {
            for (let i=0; i < list.length; i++) {
                callback.call(context, list[i]);
            }
        } else {
            callback.call(context, list);
        }
    }
}

/**
 * @name Deferred
 * @param [fn]
 * @return {Deferred}
 */
exports.Deferred = function Deferred(fn) {
    const doneFuncs = [];
    const failFuncs = [];
    const progressFuncs = [];
    let status = PENDING;
    let resultArgs = null;
    /**
     * @lends Deferred.prototype
     */
    const promise = {
        done() {
            for (let i = 0; i < arguments.length; i++) {
                if (!arguments[i]) {
                    continue;
                }
                forEach(arguments[i], function (callback) {
                    if (status === RESOLVED) {
                        callback.apply(this, resultArgs);
                    }
                    doneFuncs.push(callback);
                }, this);
            }
            return this;
        },
        fail() {
            for (let i = 0; i < arguments.length; i++) {
                if (!arguments[i]) {
                    continue;
                }
                forEach(arguments[i], function (callback) {
                    if (status === REJECTED) {
                        callback.apply(this, resultArgs);
                    }
                    failFuncs.push(callback);
                }, this);
            }
            return this;
        },
        always() {
            return this.done.apply(this, arguments).fail.apply(this, arguments);
        },
        progress() {
            for (let i = 0; i < arguments.length; i++) {
                if (!arguments[i]) {
                    continue;
                }
                forEach(arguments[i], function (callback) {
                    if (status === PENDING) {
                        progressFuncs.push(callback);
                    }
                }, this);
            }
            return this;
        },
        then() {
            if (arguments.length > 1 && arguments[1]) {
                this.fail(arguments[1]);
            }
            if (arguments.length > 0 && arguments[0]) {
                this.done(arguments[0]);
            }
            if (arguments.length > 2 && arguments[2]) {
                this.progress(arguments[2]);
            }
            return this;
        },
        promise(object) {
            let prop;
            if (object === null) {
                return promise;
            }
            for (prop in promise) {
                if (promise.hasOwnProperty(prop)) {
                    object[prop] = promise[prop];
                }
            }
            return object;
        },
        state() {
            return status;
        },
        isPending() {
            return status === PENDING;
        },
        isRejected() {
            return status === REJECTED;
        },
        isResolved() {
            return status === RESOLVED;
        }
    };
    /**
     * @lends Deferred.prototype
     */
    const deferred = {
        resolveWith(context) {
            if (status === PENDING) {
                status = RESOLVED;
                let args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                for (let i = 0; i < doneFuncs.length; i++) {
                    doneFuncs[i].apply(context, args);
                }
            }
            return this;
        },
        rejectWith(context) {
            if (status === PENDING) {
                status = REJECTED;
                let args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                for (let i = 0; i < failFuncs.length; i++) {
                    failFuncs[i].apply(context, args);
                }
            }
            return this;
        },
        notifyWith(context) {
            if (status === PENDING) {
                let args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                for (let i = 0; i < progressFuncs.length; i++) {
                    progressFuncs[i].apply(context, args);
                }
            }
            return this;
        },
        resetState(){
            status = PENDING;
            return this;
        },
        resolve() {
            return this.resolveWith(this, arguments);
        },
        reject() {
            return this.rejectWith(this, arguments);
        },
        notify() {
            return this.notifyWith(this, arguments);
        }
    };
    const obj = promise.promise(deferred);
    if (isFunction(fn)) {
        fn.call(obj, obj);
    }
    return obj;
}