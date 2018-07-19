var modules = {};

var instance = {};

var getModule = function (name) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '));
    }
    return modules[name];
};

var newModule = function (name, params) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '));
    }
    return new modules[name](params || {});
};

var addModule = function (name, module) {
    if (modules[name]) {
        throw Error(['module already added', name].join(' '));
    }
    modules[name] = module;
};


var $checkout = function (name, params) {
    if (instance[name]) return instance[name];
    return ( instance[name] = newModule(name, params) );
};

$checkout.get = function (name, params) {
    return newModule(name, params);
};

$checkout.module = function (name) {
    return getModule(name);
};

$checkout.proxy = function (name) {
    return getModule(name).apply(this, Array.prototype.slice.call(arguments, 1));
};

$checkout.add = function (name, module) {
    addModule(name, module);
    return this;
};

$checkout.scope = function (name, module) {
    addModule(name, module(this));
    return this;
};

$checkout.scope('Class', function () {
    var init = false;
    var fnTest = /xyz/.test(function () {
        xyz;
    }) ? /\b_super\b/ : /.*/;
    var Class = function () {

    };
    Class.prototype = {
        instance: function (params) {
            return new this.constructor(params);
        },
        proxy: function (fn) {
            fn = typeof(fn) == 'string' ? this[fn] : fn;
            return (function (cx, cb) {
                return function () {
                    return cb.apply(cx, [this].concat(Array.prototype.slice.call(arguments)))
                };
            })(this, fn);
        }
    };
    Class.extend = function (instance, name) {
        var prop, proto, parent = this.prototype;
        init = true;
        proto = new this();
        init = false;
        for (prop in instance) {
            if (instance.hasOwnProperty(prop)) {
                if (typeof(parent[prop]) == 'function' &&
                    typeof(instance[prop]) == 'function' &&
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
        };
        Class.prototype = proto;
        Class.prototype.name = name;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
    return Class;
});


$checkout.scope('Utils', function (ns) {
    return ns.module('Class').extend({
        getType: function (o) {
            return ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        },
        isObject: function (o) {
            return this.getType(o) === 'object';
        },
        isPlainObject: function (o) {
            return (!!o && typeof o === 'object' && o.constructor === Object);
        },
        isFunction: function (o) {
            return this.getType(o) === 'function';
        },
        isRegexp: function (o) {
            return this.getType(o) === 'regexp';
        },
        isArguments: function (o) {
            return this.getType(o) === 'arguments';
        },
        isError: function (o) {
            return this.getType(o) === 'error';
        },
        isArray: function (o) {
            return this.getType(o) === 'array';
        },
        isDate: function (o) {
            return this.getType(o) === 'date';
        },
        isString: function (o) {
            return this.getType(o) === 'string';
        },
        isNumber: function (o) {
            return this.getType(o) === 'number';
        },
        isElement: function (o) {
            return o && o.nodeType === 1;
        },
        toArray: function (o) {
            return [].slice.call(o);
        },
        querySelectorAll: function (o, p) {
            return this.toArray((p || document).querySelectorAll(o));
        },
        querySelector: function (o, p) {
            return (p || document).querySelector(o);
        },
        forEach: function (ob, cb, cx) {
            var p;
            for (p in ob)
                if (ob.hasOwnProperty(p))
                    cb.call(cx || null, ob[p], p);
        },
        map: function (ob, cb, cx) {
            var p, t, r = [];
            for (p in ob)
                if (ob.hasOwnProperty(p))
                    if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                        r[p] = t;
            return r;
        },
        removeElement: function (el) {
            el.parentNode.removeChild(el);
        },
        createElement: function (el) {
            return document.createElement(el);
        },
        getStyle: function (el, prop, getComputedStyle) {
            getComputedStyle = window.getComputedStyle;
            return (getComputedStyle ? getComputedStyle(el) : el.currentStyle)[prop.replace(/-(\w)/gi, function (word, letter) {
                return letter.toUpperCase()
            })];
        },
        extend: function (obj) {
            this.forEach(Array.prototype.slice.call(arguments, 1), function (o) {
                if (o !== null) {
                    this.forEach(o, function (value, key) {
                        obj[key] = value;
                    });
                }
            }, this);
            return obj;
        }
    });
});

$checkout.scope('Deferred', function (ns) {
    var utils = ns('Utils');

    function isArray(o) {
        return utils.isArray(o);
    };

    function isFunction(o) {
        return utils.isFunction(o);
    };

    function foreach(arr, handler) {
        if (isArray(arr)) {
            for (var i = 0; i < arr.length; i++) {
                handler(arr[i]);
            }
        }
        else
            handler(arr);
    };

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
                        if (utils.isArray(arguments[i])) {
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
    };
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
            var list = this.events[type] || this.empty,
                i = list.length = callback ? list.length : 0;
            while (i--) callback === list[i][0] && list.splice(i, 1);
            return this;
        },
        trigger: function (type) {
            var e = this.events[type] || this.empty,
                list = e.length > 0 ? e.slice(0, e.length) : e,
                i = 0, j;
            while (j = list[i++]) j.apply(j, this.empty.slice.call(arguments, 1));
            return this;
        }
    });
});

$checkout.scope('Module', function (ns) {
    return ns.module('Class').extend({
        utils: ns('Utils'),
        getListener: function () {
            if (!this._listener_) this._listener_ = ns.get('Event');
            return this._listener_;
        },
        destroy: function () {
            this.off();
        },
        on: function (type, callback) {
            this.getListener().on(type, callback);
            return this;
        },
        off: function (type, callback) {
            this.getListener().off(type, callback);
            return this;
        },
        proxy: function (fn) {
            if (!this._proxy_cache_) this._proxy_cache_ = {};
            if (this.utils.isString(fn)) {
                if (!this._proxy_cache_[fn]) {
                    this._proxy_cache_[fn] = this._super(fn);
                }
                return this._proxy_cache_[fn];
            }
            return this._super(fn);
        },
        trigger: function () {
            this.getListener().trigger.apply(this.getListener(), arguments);
            return this;
        },
        each: function (ob, cb) {
            this.utils.forEach(ob, this.proxy(cb));
        },
        addAttr: function (el, ob) {
            if (!this.utils.isElement(el)) return false;
            this.utils.forEach(ob, function (v, k) {
                el.setAttribute(k, v);
            });
        },
        addCss: function (el, ob) {
            if (!this.utils.isElement(el)) return false;
            this.utils.forEach(ob, function (v, k) {
                el.style[k] = v;
            });
        },
        addEvent: function (el, ev, cb) {
            if (!el || !ev || !cb) return false;
            cb = this.proxy(cb);
            if (el.addEventListener) el.addEventListener(ev, cb);
            else if (el.attachEvent) el.attachEvent('on' + ev, cb);
        },
        removeEvent: function (el, ev, cb) {
            if (!el || !ev || !cb) return false;
            cb = this.proxy(cb);
            if (el.removeEventListener) el.removeEventListener(ev, cb, false);
            else if (el.detachEvent) el.detachEvent('on' + ev, cb);
        },
        prepareForm: function (url, data, target, method) {
            var form = this.utils.createElement('form');
            this.addAttr(form, {
                'action': url,
                'target': target || '_self',
                'method': method || 'POST'
            });
            this.addCss(form, {
                'display': 'none'
            });
            this.utils.forEach(data, function (v, k, el) {
                el = this.utils.createElement('input');
                el.type = 'hidden';
                el.name = k;
                el.value = v;
                form.appendChild(el);
            }, this);
            return form;
        }
    });
});

$checkout.scope('Connector', function (ns) {
    return ns.module('Module').extend({
        ns: 'crossDomain',
        origin: '*',
        uniqueId: 1,
        signature: null,
        init: function (params) {
            this.setTarget(params.target);
            this.create();
        },
        create: function () {
            this.addEvent(window, 'message', 'router');
        },
        setTarget: function (target) {
            this.target = target;
            return this;
        },
        getUID: function () {
            return ++this.uniqueId;
        },
        destroy: function () {
            this.removeEvent(window, 'message', 'router');
            this._super();
        },
        router: function (window, ev, response) {
            if (this.target !== ev.source) return false;
            try {
                response = JSON.parse(ev.data);
            } catch (e) {
            }
            if (response.action && response.data) {
                this.trigger(response.action, response.data);
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

$checkout.scope('Modal', function (ns) {
    return ns.module('Module').extend({
        init: function (params) {
            this.checkout = params.checkout;
            this.data = params.data;
            this.template = ns.get('Template', '3ds.ejs');
            this.body = this.utils.querySelector('body');
            this.initModal();
            this.initConnector();
        },
        initModal: function () {
            this.name = ['modal-iframe', this.getRandomNumber()].join('-');
            this.modal = this.utils.createElement('div');
            this.modal.innerHTML = this.template.render(this.data);
            this.iframe = this.find('.ipsp-modal-iframe');
            this.addAttr(this.iframe, {name: this.name, id: this.name});
            if (this.data.send_data) {
                this.form = this.prepareForm(this.data.url, this.data.send_data, this.name);
                this.modal.appendChild(this.form);
            } else {
                this.iframe.src = this.data.url;
            }
            this.addEvent(this.find('.ipsp-modal-close'), 'click', 'closeModal');
            this.addEvent(this.find('.ipsp-modal-title a'), 'click', 'submitForm');
            this.initScrollbar();
            this.body.appendChild(this.modal);
            if (this.form) {
                this.form.submit();
            }
        },
        measureScrollbar: function () {
            var width;
            var scrollDiv = document.createElement('div');
            scrollDiv.className = 'modal-scrollbar-measure';
            this.body.appendChild(scrollDiv);
            width = scrollDiv.offsetWidth - scrollDiv.clientWidth;
            this.utils.removeElement(scrollDiv);
            return width;
        },
        checkScrollbar: function () {
            var documentElementRect;
            var fullWindowWidth = window.innerWidth;
            if (!fullWindowWidth) {
                documentElementRect = document.documentElement.getBoundingClientRect();
                fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
            }
            this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
            this.scrollbarWidth = this.measureScrollbar()
        },
        initScrollbar: function () {
            this.checkScrollbar();
            this.bodyPad = parseInt(this.utils.getStyle(this.body, 'padding-right') || 0, 10);
            this.originalBodyPad = document.body.style.paddingRight || '';
            this.originalOverflow = document.body.style.overflow || '';
            if (this.bodyIsOverflowing) {
                this.addCss(this.body, {
                    'paddingRight': [this.bodyPad + this.scrollbarWidth, 'px'].join(''),
                    'overflow': 'hidden'
                });
            }
        },
        resetScrollbar: function () {
            this.addCss(this.body, {
                'paddingRight': this.originalBodyPad ? [this.originalBodyPad, 'px'].join('') : '',
                'overflow': this.originalOverflow
            });
        },
        getRandomNumber: function () {
            return Math.round(Math.random() * 1000000000);
        },
        find: function (selector) {
            return this.utils.querySelector(selector, this.modal);
        },
        closeModal: function (el, ev) {
            ev.preventDefault();
            this.trigger('close', this.data);
            this.removeModal();
        },
        submitForm: function (el, ev) {
            ev.preventDefault();
            this.trigger('submit', this.data);
            this.form.submit();
        },
        removeModal: function () {
            this.destroy();
        },
        destroy: function () {
            this.utils.removeElement(this.modal);
            this.resetScrollbar();
            this.connector.destroy();
            this._super();
        },
        initConnector: function () {
            this.connector = ns.get('Connector', {target: this.iframe.contentWindow});
            this.connector.on('response', this.proxy('onResponse'));
        },
        onResponse: function (ev, data) {
            this.sendResponse(data);
            this.removeModal();
        },
        sendResponse: function (data) {
            this.checkout.connector.send('request', {
                uid: data.uid,
                action: 'api.checkout.proxy',
                method: 'send',
                params: data
            });
        }
    });
});

$checkout.scope('Template', function (ns) {
    var settings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };
    var noMatch = /(.)^/;
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    var htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    };
    var entityRe = new RegExp('[&<>"\']', 'g');
    var escapeExpr = function (string) {
        if (string == null) return '';
        return ('' + string).replace(entityRe, function (match) {
            return htmlEntities[match];
        });
    };
    var counter = 0;
    var template = function (text) {
        var render;
        var matcher = new RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, function (match) {
                return '\\' + escapes[match];
            });
            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':escapeExpr(__t))+\n'";
            }
            if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }
            if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }
            index = offset + match.length;
            return match;
        });
        source += "';\n";
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n//# sourceURL=/tmpl/source[" + counter++ + "]";
        try {
            render = new Function(settings.variable || 'obj', 'escapeExpr', source);
        } catch (e) {
            e.source = source;
            throw e;
        }
        var template = function (data) {
            return render.call(this, data, escapeExpr);
        };
        template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';
        return template;
    };
    return ns.module('Utils').extend({
        init: function (name) {
            this.name = name;
            this.view = {};
            this.output();
        },
        output: function () {
            this.view.source = ns.views[this.name];
            this.view.output = template(this.view.source);
        },
        render: function (data) {
            this.data = data;
            return this.view.output.call(this, this);
        },
        include: function (name, data) {
            return this.instance(name).render(this.extend(this.data, data));
        }
    });
});


$checkout.scope('Model', function (ns) {
    return ns.module('Module').extend({
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
        alt: function (prop, defaults) {
            prop = this.attr(prop);
            return typeof(prop) === 'undefined' ? defaults : prop;
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
                    if (len === 2) {
                        data = (data[name[i]] = {});
                    }
                    else {
                        break;
                    }
                }
            }
            if (len === 1) {
                return data ? data[prop] : undefined;
            }
            if (len === 2) {
                data[prop] = value;
            }
            return this;
        },
        stringify: function () {
            return JSON.stringify(this.serialize());
        },
        serialize: function () {
            return this.data;
        }
    });
});

$checkout.scope('Response', function (ns) {
    return ns.module('Model').extend({
        stringFormat: function (string) {
            var that = this;
            return (string || '').replace(/{(.+?)}/g, function (match, prop) {
                return that.attr(['order.order_data', prop].join('.')) || match;
            });
        },
        formDataSubmit: function (url, data, target, method) {
            var url = this.stringFormat(url);
            var form = this.prepareForm(url, data, target, method);
            var body = this.utils.querySelector('body');
            body.appendChild(form);
            form.submit();
            form.parentNode.removeChild(form);
        },
        inProgress: function () {
            return this.attr('order.in_progress');
        },
        readyToSubmit: function () {
            return this.attr('order.ready_to_submit');
        },
        waitForResponse: function () {
            return this.attr('order.pending');
        },
        needVerifyCode: function () {
            return this.attr('order.need_verify_code');
        },
        redirectUrl: function () {
            if (this.attr('url')) {
                location.assign(this.attr('url'));
                return true;
            }
            return false;
        },
        submitToMerchant: function () {
            var ready = this.attr('order.ready_to_submit');
            var url = this.attr('order.response_url');
            var data = this.attr('order.order_data');
            if (ready && url && data) {
                this.formDataSubmit(url, data, '_self', 'POST');
                return true;
            }
        },
        submitForm: function () {
            var method = this.attr('method');
            var url = this.attr('url');
            var data = this.attr('send_data');
            if (url && data) {
                this.formDataSubmit(url, data, '_self', method);
                return true;
            }
            return false;
        },
        sendResponse: function () {
            var action = this.attr('action');
            if (action === 'submit')
                return this.submitForm();
            if (action === 'redirect')
                return this.redirectUrl();
            return false;
        }
    });
});

$checkout.scope('FormData', function (ns) {
    return ns.module('Module').extend({
        init: function (form) {
            this.setFormElement(form);
        },
        setFormElement: function (form) {
            if (this.utils.isElement(form)) {
                this.form = form;
            }
        },
        getData: function (filter) {
            var params = this.deparam(this.serializeArray());
            return filter == true ? this.clean(params) : params;
        },
        clean: function (obj) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (obj[prop].length === 0) {
                        if (this.utils.isArray(obj)) obj.splice(prop, 1);
                        if (this.utils.isPlainObject(obj)) delete obj[prop];
                    } else if (this.utils.isPlainObject(obj[prop])) {
                        this.clean(obj[prop]);
                    }
                }
            }
            return obj;
        },
        serializeArray: function () {
            var list = this.utils.toArray(this.form.elements);
            var data = this.utils.map(list, function (field) {
                if (field.disabled || field.name === '') return;
                if (field.type.match('checkbox|radio') && !field.checked) return;
                return {
                    name: field.name,
                    value: field.value
                };
            });
            return data;
        },
        serializeAndEncode: function () {
            return this.utils.map(this.serializeArray(), function (field) {
                return [field.name, encodeURIComponent(field.value)].join('=');
            }).join('&');
        },
        deparam: function (obj) {
            var prop;
            var result = {};
            var breaker = /[^\[\]]+|\[\]$/g;
            var attr = function (name, value) {
                var i, data = result, last = name.pop(), len = name.length;
                for (i = 0; i < len; i++) {
                    if (!data[name[i]])
                        data[name[i]] = len == i + 1 && last == '[]' ? [] : {};
                    data = data[name[i]];
                }
                if (last == '[]') {
                    data.push(value);
                } else {
                    data[last] = value;
                }
            };
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    attr(obj[prop].name.match(breaker), obj[prop].value);
                }
            }
            return result;
        }
    });
});

$checkout.scope('Api', function (ns) {
    return ns.module('Module').extend({
        origin: 'https://api.fondy.eu',
        endpoint: {
            gateway: '/checkout/v2/'
        },
        styles:{
            'width':'1px !important',
            'height':'1px !important',
            'left':'1px !important',
            'bottom':'1px !important',
            'position':'fixed !important',
            'border':'0px !important'
        },
        init: function () {
            this.loaded  = false;
            this.created = false;
        },
        setOrigin: function (origin) {
            this.origin = origin;
            return this;
        },
        url: function (type, url) {
            return [this.origin, this.endpoint[type] || '/', url || ''].join('');
        },
        getFrameStyles:function(){
            var props = [];
            this.utils.forEach(this.styles,function(value,key){
                props.push([key,value].join(':'));
            });
            return props.join(';');
        },
        loadFrame: function (url) {
            this.iframe = this.utils.createElement('iframe');
            this.addAttr(this.iframe, {'src': url});
            this.addAttr(this.iframe, {'style':this.getFrameStyles()});
            this.body = this.utils.querySelector('body');
            if(this.body.firstChild){
                this.body.insertBefore(this.iframe,this.body.firstChild);
            } else {
                this.body.appendChild(this.iframe);
            }
            return this.iframe;
        },
        create: function () {
            if (this.created === false) {
                this.created = true;
                this.iframe = this.loadFrame(this.url('gateway'));
                this.connector = ns.get('Connector', {target: this.iframe.contentWindow});
                this.connector.on('load', this.proxy('onLoadConnector'));
                this.connector.on('modal', this.proxy('onOpenModal'));
            }
            return this;
        },
        onOpenModal: function (xhr, data) {
            this.modal = ns.get('Modal', {checkout: this, data: data});
            this.modal.on('close', this.proxy('onCloseModal'));
        },
        onCloseModal: function (modal, data) {
            this.trigger('modal.close', modal, data);
        },
        onLoadConnector: function () {
            this.loaded = true;
            this.connector.off('load');
            this.trigger('checkout.api');
            this.off('checkout.api');
        },
        scope: function (callback) {
            callback = this.proxy(callback);
            if (this.create().loaded === true) {
                callback();
            } else {
                this.on('checkout.api', callback);
            }
        },
        request: function (model, method, params) {
            var defer = ns.get('Deferred');
            var data = {
                uid: this.connector.getUID(),
                action: model,
                method: method,
                params: params || {}
            };
            this.connector.send('request', data);
            this.connector.on(data.uid, this.proxy(function (ev, response) {
                defer[response.error ? 'rejectWith' : 'resolveWith'](this, [ns.get('Response', response)]);
            }));
            return defer;
        }
    });
});


$checkout.scope('Widget', function (ns) {
    return ns.module('Api').extend({
        init: function (params) {
            this._super(this.params = params);
            this.initWidget();
        },
        initWidget: function () {
            this.initOptions(this.params.options);
            if (this.utils.isString(this.params.element)) {
                this.initElement(this.params.element);
            }
            if (this.utils.isString(this.params.origin)) {
                this.setOrigin(this.params.origin);
            }
        },
        initOptions: function () {
            if (this.utils.isPlainObject(this.params.options)) {
                this.params.options = this.params.options || {};
            }
        },
        initElement: function (el) {

        },
        addSelectorEvent: function (el, ev, cb) {
            this.each(this.utils.querySelectorAll(el), function (cx, element) {
                this.addEvent(element, ev, cb);
            });
            return this;
        },
        getRequestParams: function () {
            return {};
        },
        sendRequest: function (el, ev) {
            if (ev.defaultPrevented) return;
            ev.preventDefault();
            this.trigger('request', this.getRequestParams(el) );
            this.scope(function () {
                this.request('api.checkout.form', 'request', this.getRequestParams(el))
                    .done(this.proxy('onSuccess')).fail(this.proxy('onError'));
            });
        },
        onSuccess: function (cx, model) {
            model.sendResponse();
            model.submitToMerchant();
            this.trigger('success', model);
        },
        onError: function (cx, model) {
            this.trigger('error', model);
        }
    });
});

$checkout.scope('FormWidget', function (ns) {
    return ns.module('Widget').extend({
        initElement: function (el) {
            this.addSelectorEvent(el, 'submit', 'sendRequest');
        },
        getRequestParams: function (el) {
            return this.utils.extend({}, this.params.options, ns.get('FormData', el).getData());
        }
    });
});

$checkout.scope('ButtonWidget', function (ns) {
    return ns.module('Widget').extend({
        attributes: {},
        initElement: function (el) {
            if (this.utils.isPlainObject(this.params.attributes)) {
                this.utils.extend(this.attributes, this.params.attributes);
            }
            this.addSelectorEvent(el, 'click', 'sendRequest');
        },
        getRequestParams: function (el) {
            return this.utils.extend({}, this.params.options, this.getElementData(el));
        },
        getElementData: function (el) {
            var result = {};
            this.utils.forEach(this.attributes, function (value, key) {
                if (el.hasAttribute(key)) {
                    result[value] = el.getAttribute(key);
                }
            });
            return result;
        }
    });
});