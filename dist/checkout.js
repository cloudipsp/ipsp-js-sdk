'use strict';
(function () {
    var type = function (o) {
        return ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    };
    this.isObject = function (o) {
        return type(o) === 'object';
    };
    this.isPlainObject = function(o){
        return (!!o && typeof o === 'object' && o.constructor === Object);
    };
    this.isFunction = function (o) {
        return type(o) === 'function';
    };
    this.isRegexp = function (o) {
        return type(o) === 'regexp';
    };
    this.isArguments = function (o) {
        return type(o) === 'arguments';
    };
    this.isError = function (o) {
        return type(o) === 'error';
    };
    this.isArray = function (o) {
        return type(o) === 'array';
    };
    this.isDate = function (o) {
        return type(o) === 'date';
    };
    this.isString = function (o) {
        return type(o) === 'string';
    };
    this.isNumber = function (o) {
        return type(o) === 'number';
    };
    this.isBoolean = function (o) {
        return type(o) === 'boolean';
    };
    this.isElement = function (o) {
        return o && o.nodeType === 1;
    };
    this.getType = type;
}).call(window || {});

'use strict';
(function (ns) {
    var modules = {};
    var instance = {};
    var getModule = function (name) {
        if (!modules[name]) {
            throw Error('module is undefined');
        }
        return modules[name];
    };
    var newModule = function (name, params) {
        if (!modules[name]) {
            throw Error('module is undefined');
        }
        return new modules[name](params || {});
    };
    var addModule = function (name, module) {
        if (modules[name]) {
            throw Error('module already added');
        }
        modules[name] = module;
    };
    ns.$checkout = function (name, params) {
        if (instance[name]) return instance[name];
        return ( instance[name] = newModule(name, params) );
    };
    ns.$checkout.get = function (name, params) {
        return newModule(name, params);
    };
    ns.$checkout.module = function (name) {
        return getModule(name);
    };
    ns.$checkout.proxy = function (name) {
        return getModule(name).apply(this, Array.prototype.slice.call(arguments, 1));
    };
    ns.$checkout.add = function (name, module) {
        addModule(name, module);
        return this;
    };
    ns.$checkout.scope = function (name, module) {
        addModule(name, module(this));
        return this;
    };
})(window || {});
/**
 *
 */
$checkout.scope('removeElement', function () {
    return function (el) {
        el.parentNode.removeChild(el);
    };
});
/**
 *
 */
$checkout.scope('addEvent', function () {
    return function (el, type, callback) {
        if (!el) return false;
        if (el.addEventListener) el.addEventListener(type, callback);
        else if (el.attachEvent) el.attachEvent('on' + type, callback);
    }
});
/**
 *
 */
$checkout.scope('popupBlocker', function (ns) {
    return function (poppedWindow) {
        var result = false;
        try {
            if (typeof poppedWindow == 'undefined') {
                result = true;
            } else if (poppedWindow && poppedWindow.closed) {
                result = false;
            } else if (poppedWindow && poppedWindow.test) {
                result = false;
            } else {
                result = true;
            }
        } catch (err) {

        }
        return result;
    };
});
/**
 *
 */
$checkout.scope('Class', function () {
    var init = false;
    var fnTest = /xyz/.test((function () {
        return 'xyz'
    }).toString()) ? /\b_super\b/ : /.*/;
    var Core = function () {

    };
    Core.prototype = {
        instance: function (params) {
            return new this.constructor(params);
        },
        proxy: function (fn) {
            fn = typeof(fn) === 'string' ? this[fn] : fn;
            return (function (cx, cb) {
                return function () {
                    return cb.apply(cx, [this].concat(Array.prototype.slice.call(arguments)))
                };
            })(this, fn);
        }
    };
    Core.extend = function (instance) {
        var prop, proto, parent = this.prototype;
        init = true;
        proto = new this();
        init = false;
        for (prop in instance) {
            if (instance.hasOwnProperty(prop)) {
                if (typeof(parent[prop]) === 'function' &&
                    typeof(instance[prop]) === 'function' &&
                    fnTest.test(instance[prop])
                ) {
                    proto[prop] = (function (name, fn) {
                        return function () {
                            var temp = this._super, result;
                            this._super = parent[name];
                            result = fn.apply(this, arguments);
                            this._super = temp;
                            return result;
                        };
                    })(prop, instance[prop]);
                } else {
                    proto[prop] = instance[prop];
                }
            }
        }

        function Class() {
            if (!init && this.init) this.init.apply(this, arguments);
        }

        Class.prototype = proto;
        Class.prototype.constructor = Core;
        Class.extend = Core.extend;
        return Class;
    };
    return Core;
});
/**
 *
 */
$checkout.scope('Deferred', function () {
    function isArray(arr) {
        return Object.prototype.toString.call(arr) === '[object Array]';
    }

    function foreach(arr, handler) {
        if (isArray(arr)) {
            for (var i = 0; i < arr.length; i++) {
                handler(arr[i]);
            }
        }
        else
            handler(arr);
    }

    function D(fn) {
        var status = 'pending',
            doneFuncs = [],
            failFuncs = [],
            progressFuncs = [],
            resultArgs = null,
            promise = {
                done: function () {
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
                        }
                        else {
                            if (status === 'resolved') {
                                arguments[i].apply(this, resultArgs);
                            }
                            doneFuncs.push(arguments[i]);
                        }
                    }
                    return this;
                },
                fail: function () {
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
                        }
                        else {
                            if (status === 'rejected') {
                                arguments[i].apply(this, resultArgs);
                            }
                            failFuncs.push(arguments[i]);
                        }
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
                        if (isArray(arguments[i])) {
                            var arr = arguments[i];
                            for (var j = 0; j < arr.length; j++) {
                                if (status === 'pending') {
                                    progressFuncs.push(arr[j]);
                                }
                            }
                        }
                        else {
                            if (status === 'pending') {
                                progressFuncs.push(arguments[i]);
                            }
                        }
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
                promise: function (obj) {
                    if (obj === null) {
                        return promise;
                    } else {
                        for (var i in promise) {
                            obj[i] = promise[i];
                        }
                        return obj;
                    }
                },
                state: function () {
                    return status;
                },
                debug: function () {
                    console.log('[debug]', doneFuncs, failFuncs, status);
                },
                isRejected: function () {
                    return status === 'rejected';
                },
                isResolved: function () {
                    return status === 'resolved';
                },
                pipe: function (done, fail) {
                    return D(function (def) {
                        foreach(done, function (func) {
                            if (typeof func === 'function') {
                                deferred.done(function () {
                                    var returnval = func.apply(this, arguments);
                                    if (returnval && typeof returnval === 'function') {
                                        returnval.promise().then(def.resolve, def.reject, def.notify);
                                    }
                                    else {
                                        def.resolve(returnval);
                                    }
                                });
                            }
                            else {
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
                            }
                            else {
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

    D.when = function () {
        if (arguments.length < 2) {
            var obj = arguments.length ? arguments[0] : undefined;
            if (obj && (typeof obj.isResolved === 'function' && typeof obj.isRejected === 'function')) {
                return obj.promise();
            }
            else {
                return D().resolve(obj).promise();
            }
        }
        else {
            return (function (args) {
                var df = D(),
                    size = args.length,
                    done = 0,
                    rp = new Array(size);

                for (var i = 0; i < args.length; i++) {
                    (function (j) {
                        var obj = null;

                        if (args[j].done) {
                            args[j].done(function () {
                                rp[j] = (arguments.length < 2) ? arguments[0] : arguments;
                                if (++done == size) {
                                    df.resolve.apply(df, rp);
                                }
                            })
                                .fail(function () {
                                    df.reject(arguments);
                                });
                        } else {
                            obj = args[j];
                            args[j] = new Deferred();

                            args[j].done(function () {
                                rp[j] = (arguments.length < 2) ? arguments[0] : arguments;
                                if (++done == size) {
                                    df.resolve.apply(df, rp);
                                }
                            })
                                .fail(function () {
                                    df.reject(arguments);
                                }).resolve(obj);
                        }
                    })(i);
                }

                return df.promise();
            })(arguments);
        }
    }
    return D;
});

$checkout.scope('Event', function (ns) {
    return ns.module('Class').extend({
        init: function () {
            this.events = {};
            this.empty = [];
        },
        on: function (type, callback) {
            (this.events[type] = this.events[type] || []).push(callback);
            return this;
        },
        off: function (type, callback) {
            type || (this.events = {});
            var list = this.events[type] || this.empty, i = list.length = callback ? list.length : 0;
            while (i--) callback === list[i][0] && list.splice(i, 1);
            return this;
        },
        trigger: function (type) {
            var e = this.events[type] || this.empty, list = e.length > 0 ? e.slice(0, e.length) : e, i = 0, j;
            while (j = list[i++]) j.apply(j, this.empty.slice.call(arguments, 1));
            return this;
        }
    });
});

$checkout.scope('Connector', function (ns) {
    return ns.module('Class').extend({
        ns: 'crossDomain',
        origin: '*',
        uniqueId: 1,
        init: function (params) {
            this.setTarget(params.target);
            this.create();
        },
        create: function () {
            this.listener = ns.get('Event');
            ns.proxy('addEvent', window, 'message', this.proxy('router'));
        },
        setTarget: function (target) {
            this.target = target;
            return this;
        },
        getUID: function () {
            return ++this.uniqueId;
        },
        unbind: function (action, callback) {
            this.listener.off([this.ns, action].join('.'), callback);
        },
        action: function (action, callback) {
            this.listener.on([this.ns, action].join('.'), callback);
        },
        publish: function (action, data) {
            this.listener.trigger([this.ns, action].join('.'), data);
        },
        router: function (window, ev, response) {
            try {
                response = JSON.parse(ev.data);
            } catch (e) {
            }
            if (response.action && response.data) {
                this.publish(response.action, response.data);
            }
        },
        send: function (action, data) {
            this.target.postMessage(JSON.stringify({
                action: action,
                data: data
            }), this.origin, []);
        }
    });
});

$checkout.scope('AcsFrame', function (ns) {
    return ns.module('Class').extend({
        name: 'acsframe',
        attrs: {
            'frameborder': '0',
            'allowtransparency': 'true',
            'scrolling': 'no'
        },
        styles: {
            'overflowX': 'hidden',
            'border': '0',
            'display': 'block',
            'width': '100%',
            'height': '750px'
        },
        init: function (params) {
            this.checkout = params.checkout;
            this.data = params.data;
            this.template = ns.views['3ds.html'];
            this.initModal();
            this.initEvents();
            this.initFrame();
            this.initConnector();
        },
        initFrame: function () {
            this.name = [this.name, Math.round(Math.random() * 1000000000)].join('');
            this.wrapper = this.find('.ipsp-modal-content');
            this.iframe = document.createElement('iframe');
            this.iframe.setAttribute('name', this.name);
            this.iframe.setAttribute('id', this.name);
            this.iframe.className = 'ipsp-modal-iframe';
            this.addAttr(this.iframe, this.attrs);
            this.addCss(this.iframe, this.styles);
            this.form = this.prepareForm(this.data.url, this.data.send_data, this.name);
            this.wrapper.appendChild(this.iframe);
            this.wrapper.appendChild(this.form);
            this.form.submit();
        },
        initModal: function () {
            this.modal = document.createElement('div');
            this.modal.innerHTML = this.template;
            document.querySelector('body').appendChild(this.modal);
        },
        find: function (selector) {
            return this.modal.querySelector(selector);
        },
        initEvents: function () {
            var close = this.find('.ipsp-modal-close');
            var link = this.find('.ipsp-modal-title a');
            ns.proxy('addEvent', close, 'click', this.proxy(function (el, ev) {
                ev.preventDefault();
                this.removeModal();
            }));
            ns.proxy('addEvent', link, 'click', this.proxy(function (el, ev) {
                ev.preventDefault();
                this.form.submit();
            }));
        },
        removeModal: function () {
            ns.proxy('removeElement', this.modal);
        },
        prepareForm: function (url, data, target, method) {
            var elem;
            var form = document.createElement('form');
            form.action = url;
            form.target = target || '_self';
            form.method = method || 'POST';
            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {
                    elem = document.createElement('input');
                    elem.type = 'hidden';
                    elem.name = prop;
                    elem.value = data[prop];
                    form.appendChild(elem);
                }
            }
            form.style.display = 'none';
            return form;
        },
        initConnector: function () {
            this.connector = ns.get('Connector');
            this.connector.action('response', this.proxy(function (ev, data) {
                this.connector.unbind('response');
                this.checkout.connector.send('request', {
                    uid: data.uid,
                    action: 'api.checkout.proxy',
                    method: 'send',
                    params: data
                });
                this.removeModal();
            }, this));
        },
        addCss: function (elem, styles) {
            if (!elem)
                return false;
            for (var prop in styles) {
                if (styles.hasOwnProperty(prop)) {
                    elem.style[prop] = styles[prop];
                }
            }
        },
        addAttr: function (elem, attributes) {
            var prop;
            if (!elem)
                return false;
            for (prop in attributes) {
                if (attributes.hasOwnProperty(prop)) {
                    elem.setAttribute(prop, attributes[prop]);
                }
            }
        }
    });
});

$checkout.scope('Model', function (ns) {
    return ns.module('Class').extend({
        init: function (data) {
            if (data) {
                this.data = data;
            } else {
                this.data = {};
            }
        },
        each: function () {
            var args = arguments;
            var name = args[1] ? args[0] : null;
            var callback = args[1] ? args[1] : args[0];
            var prop, value = name ? this.alt(name, []) : this.data;
            for (prop in value) {
                if (value.hasOwnProperty(prop)) {
                    callback(this.instance(value[prop]), value[prop], prop);
                }
            }
        },
        isPlainObject: function (value) {
            return isPlainObject(value);
        },
        isArray: function (value) {
            return isArray(value);
        },
        attr: function (key, value) {
            var i = 0,
                data = this.data,
                name = (key || '').split('.'),
                prop = name.pop(),
                len = arguments.length;
            for (; i < name.length; i++) {
                if (data && data.hasOwnProperty(name[i])) {
                    data = data[name[i]];
                }
                else {
                    if (len == 2) {
                        data = (data[name[i]] = {});
                    }
                    else {
                        break;
                    }
                }
            }
            if (len == 1) {
                return data ? data[prop] : undefined;
            }
            if (len == 2) {
                data[prop] = value;
            }
            return this;
        }
    });
});

$checkout.scope('Response', function (ns) {
    return ns.module('Model').extend({
        formData: function (url, data, target, method) {
            var elem;
            var form = document.createElement('form');
            var body = document.getElementsByTagName('body')[0];
            form.action = url;
            form.target = target || '_self';
            form.method = method || 'POST';
            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {
                    elem = document.createElement('input');
                    elem.type = 'hidden';
                    elem.name = prop;
                    elem.value = data[prop];
                    form.appendChild(elem);
                }
            }
            form.style.display = 'none';
            return {
                submit: function () {
                    body.appendChild(form);
                    form.submit();
                    form.parentNode.removeChild(form);
                }
            };
        },
        redirectUrl: function () {
            if (this.attr('url')) {
                location.assign(this.attr('url'));
                return true;
            }
        },
        submitForm: function () {
            var method = this.attr('method');
            var url = this.attr('url');
            var data = this.attr('send_data');
            this.formData(url, data, '_top', method).submit();
            return true;
        },
        sendResponse: function () {
            var action = this.attr('action');
            if (action == 'submit')
                return this.submitForm();
            if (action == 'redirect')
                return this.redirectUrl();
            return false;
        }
    });
});

$checkout.scope('Form', function (ns) {
    return ns.module('Class').extend({
        init: function(form){
            this.form = form;
        },
        getData: function (filter, coerce, spaces) {
            var params = this.deparam(this.serializeAndEncode(), coerce, false);
            return filter == true ? this.clean(params) : params;
        },
        clean: function (obj) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (obj[prop].length === 0) {
                        if (isArray(obj)) obj.splice(prop, 1);
                        if (isPlainObject(obj)) delete obj[prop];
                    } else if (typeof(obj[prop]) == 'object') {
                        this.clean(obj[prop]);
                    }
                }
            }
            return obj;
        },
        map: function (list, callback) {
            var T, A, k;
            if (list == null) {
                throw new TypeError('this is null or not defined');
            }
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }
            var O = Object(list);
            var len = O.length >>> 0;
            if (arguments.length > 1) {
                T = arguments[1];
            }
            A = new Array(len);
            k = 0;
            while (k < len) {
                var kValue, mappedValue;
                if (k in O) {
                    kValue = O[k];
                    mappedValue = callback.call(T, kValue, k, O);
                    if(mappedValue!==undefined)
                        A[k] = mappedValue;
                }
                k++;
            }
            return A;
        },
        serializeArray: function () {
            var list = Array.prototype.slice.call(this.form.elements);
            var data = this.map(list, function (field) {
                if(field.disabled || field.name=='' ) return;
                if(field.type.match('checkbox|radio') && !field.checked) return;
                return {
                    name  : field.name ,
                    value : field.value
                };
            });
            return data;
        },
        serializeAndEncode: function () {
            return this.map(this.serializeArray(), function (field) {
                return [field.name, encodeURIComponent(field.value)].join('=');
            }).join('&');
        },
        deparam: function (params, coerce, spaces) {
            var obj = {},
                coerce_types = {'true': !0, 'false': !1, 'null': null};
            if (spaces) params = params.replace(/\+/g, ' ');
            params.split('&').forEach(function (v) {
                var param = v.split('='),
                    key = decodeURIComponent(param[0]),
                    val,
                    cur = obj,
                    i = 0,
                    keys = key.split(']['),
                    keys_last = keys.length - 1;
                if (/\[/.test(keys[0]) && /\]$/.test(keys[keys_last])) {
                    keys[keys_last] = keys[keys_last].replace(/\]$/, '');
                    keys = keys.shift().split('[').concat(keys);
                    keys_last = keys.length - 1;
                } else {
                    keys_last = 0;
                }
                if (param.length === 2) {
                    val = decodeURIComponent(param[1]);
                    if (coerce) {
                        val = val && !isNaN(val) && ((+val + '') === val) ? +val
                            : val === 'undefined' ? undefined
                                : coerce_types[val] !== undefined ? coerce_types[val]
                                    : val;
                    }
                    if (keys_last) {
                        for (; i <= keys_last; i++) {
                            key = keys[i] === '' ? cur.length : keys[i];
                            cur = cur[key] = i < keys_last
                                ? cur[key] || ( keys[i + 1] && isNaN(keys[i + 1]) ? {} : [] )
                                : val;
                        }
                    } else {
                        if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
                            obj[key].push(val);
                        } else if ({}.hasOwnProperty.call(obj, key)) {
                            obj[key] = [obj[key], val];
                        } else {
                            obj[key] = val;
                        }
                    }

                } else if (key) {
                    obj[key] = coerce
                        ? undefined
                        : '';
                }
            });
            return obj;
        }
    });
});

$checkout.scope('Api', function (ns) {
    return ns.module('Class').extend({
        origin: 'https://api.dev.fondy.eu',
        endpoint: {
            gateway: '/checkout/v2/'
        },
        init: function () {
            this.loaded = false;
            this.created = false;
            this.listener = ns.get('Event');
            this.connector = ns.get('Connector');
            this.params = {};
        },
        setOrigin: function (origin) {
            this.origin = origin;
            return this;
        },
        url: function (type, url) {
            return [this.origin, this.endpoint[type] || '/', url || ''].join('');
        },
        loadFrame: function (url) {
            this.iframe = document.createElement('iframe');
            this.iframe.src = url;
            this.iframe.style.display = 'none';
            document.getElementsByTagName('body')[0].appendChild(this.iframe);
            return this.iframe;
        },
        create: function () {
            if (this.created === false) {
                this.created = true;
                this.iframe = this.loadFrame(this.url('gateway'));
                this.connector.setTarget(this.iframe.contentWindow);
                this.connector.action('load', this.proxy('load'));
                this.connector.action('form3ds', this.proxy('form3ds'));
            }
            return this;
        },
        form3ds: function (xhr, data) {
            this.acsframe = ns.get('AcsFrame', {checkout: this, data: data});
        },
        load: function () {
            this.loaded = true;
            this.listener.trigger('checkout.api');
            this.listener.off('checkout.api');
        },
        scope: function (callback) {
            callback = this.proxy(callback);
            if (this.create().loaded === true) {
                callback();
            } else {
                this.listener.on('checkout.api', callback);
            }
        },
        defer: function () {
            return ns.get('Deferred');
        },
        request: function (model, method, params) {
            var defer = this.defer();
            var data = {};
            data.uid = this.connector.getUID();
            data.action = model;
            data.method = method;
            data.params = params || {};
            this.connector.send('request', data);
            this.connector.action(data.uid, this.proxy(function (ev, response) {
                defer[response.error ? 'rejectWith' : 'resolveWith'](this, [ns.get('Response', response)]);
            }, this));
            return defer;
        }
    });
});
'use strict';
$checkout.views = Object.create(null);
$checkout.views['3ds.html'] = '<style>\n    .ipsp-modal-show{\n        overflow:hidden;\n    }\n    .ipsp-modal{\n        margin:100px auto;\n        max-width:680px;\n        background-color:#fff;\n        border-radius:5px;\n        box-shadow:0px 2px 2px rgba(0,0,0,0.2);\n        overflow: hidden;\n    }\n    @media (max-width:850px){\n        .ipsp-modal{\n            margin:50px auto;\n        }\n    }\n    @media (max-width:695px){\n        .ipsp-modal{\n            max-width:100%;\n            margin:5px;\n        }\n    }\n    .ipsp-modal-wrapper{\n        overflow: auto;\n        position:fixed;\n        z-index:99999;\n        left:0;\n        bottom:0;\n        top:0;\n        right:0;\n        background-color: rgba(0,0,0,0.2);\n    }\n    .ipsp-modal-header{\n        background-color:#fafafa;\n        height:50px;\n        box-shadow:0px 0px 2px rgba(0,0,0,0.2);\n        border-top-left-radius:5px;\n        border-top-right-radius:5px;\n    }\n    .ipsp-modal-close{\n        float:right;\n        overflow:hidden;\n        height:50px;\n        text-decoration:none;\n        border-top-right-radius:5px;\n        color:#949494;\n    }\n    .ipsp-modal-close:hover,.ipsp-modal-close:focus,.ipsp-modal-close:active{\n        text-decoration:none;\n        color:#646464;\n    }\n    .ipsp-modal-close:before{\n        content:"×";\n        font-size:50px;\n        line-height:50px;\n        padding:0 10px;\n    }\n    .ipsp-modal-title{\n        border-top-left-radius:5px;\n        line-height:20px;\n        height:50px;\n        padding:5px 15px;\n        font-size:12px;\n        display:table-cell;\n        vertical-align: middle;\n    }\n    .ipsp-modal-content{\n        border-bottom-left-radius:5px;\n        border-bottom-left-radius:5px;\n        min-height:650px;\n    }\n</style>\n<div class="ipsp-modal-wrapper">\n    <div class="ipsp-modal">\n        <div class="ipsp-modal-header">\n            <a href="#" class="ipsp-modal-close"></a>\n            <div class="ipsp-modal-title">\n                Now you will be redirected to your bank 3DSecure.\n                If you are not redirected please refer\n                <a href=\'javascript:void(0)\'>link</a>\n            </div>\n        </div>\n        <div class="ipsp-modal-content"></div>\n    </div>\n</div>';
