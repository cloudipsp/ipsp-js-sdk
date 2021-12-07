var Utils = require('./utils');

var PENDING = 0;
var RESOLVED = 1;
var REJECTED = 2;

function isArray(value) {
    return Utils.isArray(value);
}

function isFunction(value) {
    return Utils.isFunction(value);
}

function forEach(list, callback, context) {
    var i = 0;
    if (list) {
        if (isArray(list)) {
            for (; i < list.length; i++) {
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
function Deferred(fn) {
    var status = PENDING;
    var doneFuncs = [];
    var failFuncs = [];
    var progressFuncs = [];
    var resultArgs = null;
    /**
     * @lends Deferred.prototype
     */
    var promise = {
        done: function () {
            for (var i = 0; i < arguments.length; i++) {
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
        fail: function () {
            for (var i = 0; i < arguments.length; i++) {
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
        always: function () {
            return this.done.apply(this, arguments).fail.apply(this, arguments);
        },
        progress: function () {
            for (var i = 0; i < arguments.length; i++) {
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
        then: function () {
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
        promise: function (object) {
            var prop;
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
        state: function () {
            return status;
        },
        isPending: function () {
            return status === PENDING;
        },
        isRejected: function () {
            return status === REJECTED;
        },
        isResolved: function () {
            return status === RESOLVED;
        }
    };
    /**
     * @lends Deferred.prototype
     */
    var deferred = {
        resolveWith: function (context) {
            if (status === PENDING) {
                status = RESOLVED;
                var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                for (var i = 0; i < doneFuncs.length; i++) {
                    doneFuncs[i].apply(context, args);
                }
            }
            return this;
        },
        rejectWith: function (context) {
            if (status === PENDING) {
                status = REJECTED;
                var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                for (var i = 0; i < failFuncs.length; i++) {
                    failFuncs[i].apply(context, args);
                }
            }
            return this;
        },
        notifyWith: function (context) {
            if (status === PENDING) {
                var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                for (var i = 0; i < progressFuncs.length; i++) {
                    progressFuncs[i].apply(context, args);
                }
            }
            return this;
        },
        resetState: function(){
            status = PENDING;
            return this;
        },
        resolve: function () {
            return this.resolveWith(this, arguments);
        },
        reject: function () {
            return this.rejectWith(this, arguments);
        },
        notify: function () {
            return this.notifyWith(this, arguments);
        }
    };
    var obj = promise.promise(deferred);
    if (isFunction(fn)) {
        fn.call(obj, obj);
    }
    return obj;
}


module.exports = Deferred;
