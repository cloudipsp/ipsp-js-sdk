var Utils = require('./utils');

var utils = new Utils();

function isArray(o) {
    return utils.isArray(o);
}

function isFunction(o) {
    return utils.isFunction(o);
}

function foreach(arr, handler) {
    if (isArray(arr)) {
        for (var i = 0; i < arr.length; i++) {
            handler(arr[i]);
        }
    } else
        handler(arr);
}

function Deferred(fn) {
    var status = 'pending',
        doneFuncs = [],
        failFuncs = [],
        progressFuncs = [],
        resultArgs = null,
        promise = {
            'done': function () {
                for (var i = 0; i < arguments.length; i++) {
                    if (!arguments[i]) {
                        continue;
                    }
                    if (isArray(arguments[i])) {
                        var arr = arguments[i];
                        for (var j = 0; j < arr.length; j++) {
                            if (status === 'resolved') {
                                arr[j].apply(this, resultArgs);
                            }
                            doneFuncs.push(arr[j]);
                        }
                    } else {
                        if (status === 'resolved') {
                            arguments[i].apply(this, resultArgs);
                        }
                        doneFuncs.push(arguments[i]);
                    }
                }
                return this;
            },
            'fail': function () {
                for (var i = 0; i < arguments.length; i++) {
                    if (!arguments[i]) {
                        continue;
                    }
                    if (isArray(arguments[i])) {
                        var arr = arguments[i];
                        for (var j = 0; j < arr.length; j++) {
                            if (status === 'rejected') {
                                arr[j].apply(this, resultArgs);
                            }
                            failFuncs.push(arr[j]);
                        }
                    } else {
                        if (status === 'rejected') {
                            arguments[i].apply(this, resultArgs);
                        }
                        failFuncs.push(arguments[i]);
                    }
                }
                return this;
            },
            'always': function () {
                return this.done.apply(this, arguments).fail.apply(this, arguments);
            },
            'progress': function () {
                for (var i = 0; i < arguments.length; i++) {
                    if (!arguments[i]) {
                        continue;
                    }
                    if (utils.isArray(arguments[i])) {
                        var arr = arguments[i];
                        for (var j = 0; j < arr.length; j++) {
                            if (status === 'pending') {
                                progressFuncs.push(arr[j]);
                            }
                        }
                    } else {
                        if (status === 'pending') {
                            progressFuncs.push(arguments[i]);
                        }
                    }
                }
                return this;
            },
            'then': function () {
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
            'promise': function (obj) {
                if (obj === null) {
                    return promise;
                } else {
                    for (var i in promise) {
                        obj[i] = promise[i];
                    }
                    return obj;
                }
            },
            'state': function () {
                return status;
            },
            'debug': function () {
                console.log('[debug]', doneFuncs, failFuncs, status);
            },
            'isRejected': function () {
                return status === 'rejected';
            },
            'isResolved': function () {
                return status === 'resolved';
            },
            'pipe': function (done, fail) {
                return Deferred(function (def) {
                    foreach(done, function (func) {
                        if (typeof func === 'function') {
                            deferred.done(function () {
                                var returnval = func.apply(this, arguments);
                                if (returnval && typeof returnval === 'function') {
                                    returnval.promise().then(def.resolve, def.reject, def.notify);
                                } else {
                                    def.resolve(returnval);
                                }
                            });
                        } else {
                            deferred.done(def.resolve);
                        }
                    });
                    foreach(fail, function (func) {
                        if (typeof func === 'function') {
                            deferred.fail(function () {
                                var returnval = func.apply(this, arguments);
                                if (returnval && typeof returnval === 'function') {
                                    returnval.promise().then(def.resolve, def.reject, def.notify);
                                } else {
                                    def.reject(returnval);
                                }
                            });
                        } else {
                            deferred.fail(def.reject);
                        }
                    });
                }).promise();
            }
        },
        deferred = {
            resolveWith: function (context) {
                if (status === 'pending') {
                    status = 'resolved';
                    var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                    for (var i = 0; i < doneFuncs.length; i++) {
                        doneFuncs[i].apply(context, args);
                    }
                }
                return this;
            },
            rejectWith: function (context) {
                if (status === 'pending') {
                    status = 'rejected';
                    var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                    for (var i = 0; i < failFuncs.length; i++) {
                        failFuncs[i].apply(context, args);
                    }
                }
                return this;
            },
            notifyWith: function (context) {
                if (status === 'pending') {
                    var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
                    for (var i = 0; i < progressFuncs.length; i++) {
                        progressFuncs[i].apply(context, args);
                    }
                }
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
        fn.apply(obj, [obj]);
    }
    return obj;
}

module.exports = Deferred;
