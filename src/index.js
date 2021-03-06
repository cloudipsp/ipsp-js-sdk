var modules = {};
var instance = {};

var getModule = function (name) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '));
    }
    return modules[name];
};

var isInstanceOf = function (name, obj) {
    return modules[name] && (obj instanceof modules[name]);
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
    return (instance[name] = newModule(name, params));
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
        return 'xyz';
    }.toString()) ? /\b_super\b/ : /.*/;
    var Class = function () {

    };
    Class.prototype = {
        instance: function (params) {
            return new this.constructor(params);
        },
        proxy: function (fn) {
            fn = typeof (fn) == 'string' ? this[fn] : fn;
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
                if (typeof (parent[prop]) == 'function' &&
                    typeof (instance[prop]) == 'function' &&
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
        Class.prototype.name = name;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
    return Class;
});

$checkout.scope('Utils', function (ns) {
    return ns.module('Class').extend({
        'getType': function (o) {
            return ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        },
        'isObject': function (o) {
            return this.getType(o) === 'object';
        },
        'isPlainObject': function (o) {
            return (!!o && typeof o === 'object' && o.constructor === Object);
        },
        'isFunction': function (o) {
            return this.getType(o) === 'function';
        },
        'isRegexp': function (o) {
            return this.getType(o) === 'regexp';
        },
        'isArguments': function (o) {
            return this.getType(o) === 'arguments';
        },
        'isError': function (o) {
            return this.getType(o) === 'error';
        },
        'isArray': function (o) {
            return this.getType(o) === 'array';
        },
        'isDate': function (o) {
            return this.getType(o) === 'date';
        },
        'isString': function (o) {
            return this.getType(o) === 'string';
        },
        'isNumber': function (o) {
            return this.getType(o) === 'number';
        },
        'isElement': function (o) {
            return o && o.nodeType === 1;
        },
        'toArray': function (o) {
            return [].slice.call(o);
        },
        'querySelectorAll': function (o, p) {
            return this.toArray((p || document).querySelectorAll(o));
        },
        'querySelector': function (o, p) {
            return (p || document).querySelector(o);
        },
        'forEach': function (ob, cb, cx) {
            var p;
            for (p in ob)
                if (ob.hasOwnProperty(p))
                    cb.call(cx || null, ob[p], p);
        },
        'map': function (ob, cb, cx) {
            var p, t, r = [];
            for (p in ob)
                if (ob.hasOwnProperty(p))
                    if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                        r[p] = t;
            return r;
        },
        'cleanObject': function (object) {
            var prop;
            for (prop in object) {
                if (object.hasOwnProperty(prop)) {
                    if (object[prop].length === 0) {
                        if (this.isArray(object)) object.splice(prop, 1);
                        if (this.isPlainObject(object)) delete object[prop];
                    } else if (this.isPlainObject(object[prop])) {
                        this.cleanObject(object[prop]);
                    }
                }
            }
            return object;
        },
        'param': function (data) {
            var s = [];
            var add = function (k, v) {
                v = typeof v === 'function' ? v() : v;
                v = v === null ? '' : v === undefined ? '' : v;
                s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
            };
            var build = function (prefix, obj) {
                var i, len, key;
                if (prefix) {
                    if (Array.isArray(obj)) {
                        for (i = 0, len = obj.length; i < len; i++) {
                            build(
                                prefix + '[' + (typeof obj[i] === 'object' && obj[i] ? i : '') + ']',
                                obj[i]
                            );
                        }
                    } else if (String(obj) === '[object Object]') {
                        for (key in obj) {
                            if (obj.hasOwnProperty(key))
                                build(prefix + '[' + key + ']', obj[key]);
                        }
                    } else {
                        add(prefix, obj);
                    }
                } else if (Array.isArray(obj)) {
                    for (i = 0, len = obj.length; i < len; i++) {
                        add(obj[i].name, obj[i].value);
                    }
                } else {
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            build(key, obj[key]);
                        }
                    }
                }
                return s;
            };
            return build('', data).join('&');
        },
        'removeElement': function (el) {
            el.parentNode.removeChild(el);
        },
        'createElement': function (el) {
            return document.createElement(el);
        },
        'getStyle': function (el, prop, getComputedStyle) {
            getComputedStyle = window.getComputedStyle;
            return (getComputedStyle ? getComputedStyle(el) : el['currentStyle'])[prop.replace(/-(\w)/gi, function (word, letter) {
                return letter.toUpperCase()
            })];
        },
        'extend': function (obj) {
            this.forEach([].slice.call(arguments, 1), function (o) {
                if (o !== null) {
                    this.forEach(o, function (value, key) {
                        if (this.isPlainObject(value)) {
                            obj[key] = this.extend(obj[key] || {}, value);
                        } else {
                            obj[key] = value;
                        }
                    }, this);
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

    function D(fn) {
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
                    return D(function (def) {
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

    return D;
});

$checkout.scope('Event', function (ns) {
    return ns.module('Class').extend({
        'init': function () {
            this.events = {};
            this.empty = [];
        },
        'on': function (type, callback) {
            (this.events[type] = this.events[type] || []).push(callback);
            return this;
        },
        'off': function (type, callback) {
            type || (this.events = {});
            var list = this.events[type] || this.empty,
                i = list.length = callback ? list.length : 0;
            while (i--) callback === list[i][0] && list.splice(i, 1);
            return this;
        },
        'trigger': function (type) {
            var e = this.events[type] || this.empty,
                list = e.length > 0 ? e.slice(0, e.length) : e,
                i = 0, j;
            while ((j = list[i++])) j.apply(j, this.empty.slice.call(arguments, 1));
            return this;
        }
    });
});

$checkout.scope('Module', function (ns) {
    return ns.module('Class').extend({
        'utils': ns('Utils'),
        'getListener': function () {
            if (!this._listener_) this._listener_ = ns.get('Event');
            return this._listener_;
        },
        'destroy': function () {
            this.off();
        },
        'on': function (type, callback) {
            this.getListener().on(type, callback);
            return this;
        },
        'off': function (type, callback) {
            this.getListener().off(type, callback);
            return this;
        },
        'proxy': function (fn) {
            if (!this._proxy_cache_) this._proxy_cache_ = {};
            if (this.utils.isString(fn)) {
                if (!this._proxy_cache_[fn]) {
                    this._proxy_cache_[fn] = this._super(fn);
                }
                return this._proxy_cache_[fn];
            }
            return this._super(fn);
        },
        'trigger': function () {
            this.getListener().trigger.apply(this.getListener(), arguments);
            return this;
        },
        'each': function (ob, cb) {
            this.utils.forEach(ob, this.proxy(cb));
        },
        'addAttr': function (el, ob) {
            if (!this.utils.isElement(el)) return false;
            this.utils.forEach(ob, function (v, k) {
                el.setAttribute(k, v);
            });
        },
        'addCss': function (el, ob) {
            if (!this.utils.isElement(el)) return false;
            this.utils.forEach(ob, function (v, k) {
                this.addCssProperty(el, k, v);
            }, this);
        },
        'addCssProperty': function (el, style, value) {
            var result = el.style.cssText.match(new RegExp("(?:[;\\s]|^)(" +
                style.replace("-", "\\-") + "\\s*:(.*?)(;|$))")),
                idx;
            if (result) {
                idx = result.index + result[0].indexOf(result[1]);
                el.style.cssText = el.style.cssText.substring(0, idx) +
                    style + ": " + value + ";" +
                    el.style.cssText.substring(idx + result[1].length);
            } else {
                el.style.cssText += " " + style + ": " + value + ";";
            }
        },
        'addEvent': function (el, ev, cb) {
            if (!el || !ev || !cb) return false;
            cb = this.proxy(cb);
            if (el.addEventListener) el.addEventListener(ev, cb);
            else if (el['attachEvent']) el['attachEvent']('on' + ev, cb);
        },
        'removeEvent': function (el, ev, cb) {
            if (!el || !ev || !cb) return false;
            cb = this.proxy(cb);
            if (el.removeEventListener) el.removeEventListener(ev, cb, false);
            else if (el['detachEvent']) el['detachEvent']('on' + ev, cb);
        },
        'prepareForm': function (url, data, target, method) {
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
        'ns': 'crossDomain',
        'origin': '*',
        'uniqueId': 1,
        'signature': null,
        'init': function (params) {
            this.setTarget(params.target);
            this.create();
        },
        'create': function () {
            this.addEvent(window, 'message', 'router');
        },
        'setTarget': function (target) {
            this.target = target;
            return this;
        },
        'getUID': function () {
            return ++this.uniqueId;
        },
        'destroy': function () {
            this.removeEvent(window, 'message', 'router');
            this._super();
        },
        'router': function (window, ev, response) {
            if (this.target !== ev.source) return false;
            try {
                response = JSON.parse(ev.data);
            } catch (e) {
            }
            if (response && response.action && response.data) {
                this.trigger(response.action, response.data);
            }
        },
        'send': function (action, data) {
            this.target.postMessage(JSON.stringify({
                action: action,
                data: data
            }), this.origin, []);
        }
    });
});

$checkout.scope('Modal', function (ns) {
    return ns.module('Module').extend({
        'init': function (params) {
            this.checkout = params.checkout;
            this.data = params.data;
            this.template = ns.get('Template', '3ds.ejs');
            this.body = this.utils.querySelector('body');
            this.initModal();
            this.initConnector();
        },
        'initModal': function () {
            this.name = ['modal-iframe', this.getRandomNumber()].join('-');
            this.modal = this.utils.createElement('div');
            this.modal.innerHTML = this.template.render(this.data);
            this.iframe = this.find('.ipsp-modal-iframe');
            this.addAttr(this.iframe, {name: this.name, id: this.name});
            if (this.data['send_data']) {
                this.form = this.prepareForm(this.data.url, this.data['send_data'], this.name);
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
        'measureScrollbar': function () {
            var width;
            var scrollDiv = document.createElement('div');
            scrollDiv.className = 'modal-scrollbar-measure';
            this.body.appendChild(scrollDiv);
            width = scrollDiv.offsetWidth - scrollDiv.clientWidth;
            this.utils.removeElement(scrollDiv);
            return width;
        },
        'checkScrollbar': function () {
            var documentElementRect;
            var fullWindowWidth = window.innerWidth;
            if (!fullWindowWidth) {
                documentElementRect = document.documentElement.getBoundingClientRect();
                fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
            }
            this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
            this.scrollbarWidth = this.measureScrollbar()
        },
        'initScrollbar': function () {
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
        'resetScrollbar': function () {
            this.addCss(this.body, {
                'paddingRight': this.originalBodyPad ? [this.originalBodyPad, 'px'].join('') : '',
                'overflow': this.originalOverflow
            });
        },
        'getRandomNumber': function () {
            return Math.round(Math.random() * 1000000000);
        },
        'find': function (selector) {
            return this.utils.querySelector(selector, this.modal);
        },
        'closeModal': function (el, ev) {
            ev.preventDefault();
            this.trigger('close', this.data);
            this.removeModal();
        },
        'submitForm': function (el, ev) {
            ev.preventDefault();
            this.trigger('submit', this.data);
            this.form.submit();
        },
        'removeModal': function () {
            this.destroy();
        },
        'destroy': function () {
            this.utils.removeElement(this.modal);
            this.resetScrollbar();
            this.connector.destroy();
            this._super();
        },
        'initConnector': function () {
            this.connector = ns.get('Connector', {target: this.iframe.contentWindow});
            this.connector.on('response', this.proxy('onResponse'));
        },
        'onResponse': function (ev, data) {
            this.sendResponse(data);
            this.removeModal();
        },
        'sendResponse': function (data) {
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
        if (!settings['variable']) source = 'with(obj||{}){\n' + source + '}\n';
        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n//# sourceURL=/tmpl/source[" + counter++ + "]";
        try {
            render = new Function(settings['variable'] || 'obj', 'escapeExpr', source);
        } catch (e) {
            e.source = source;
            throw e;
        }
        var template = function (data) {
            return render.call(this, data, escapeExpr);
        };
        template.source = 'function(' + (settings['variable'] || 'obj') + '){\n' + source + '}';
        return template;
    };
    return ns.module('Utils').extend({
        'init': function (name) {
            this.name = name;
            this.view = {};
            this.output();
        },
        'output': function () {
            this.view.source = ns.views[this.name];
            this.view.output = template(this.view.source);
        },
        'render': function (data) {
            this.data = data;
            return this.view.output.call(this, this);
        },
        'include': function (name, data) {
            return this.instance(name).render(this.extend(this.data, data));
        }
    });
});

$checkout.scope('Model', function (ns) {
    return ns.module('Module').extend({
        'init': function (data) {
            this.data = data || {};
            this.create();
        },
        'create': function () {

        },
        'each': function () {
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
        'alt': function (prop, defaults) {
            prop = this.attr(prop);
            return typeof (prop) === 'undefined' ? defaults : prop;
        },
        'attr': function (key, value) {
            var i = 0,
                data = this.data,
                name = (key || '').split('.'),
                prop = name.pop(),
                len = arguments.length;
            for (; i < name.length; i++) {
                if (data && data.hasOwnProperty(name[i])) {
                    data = data[name[i]];
                } else {
                    if (len === 2) {
                        data = (data[name[i]] = {});
                    } else {
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
        'stringify': function () {
            return JSON.stringify(this.serialize());
        },
        'serialize': function () {
            return this.data;
        }
    });
});

$checkout.scope('Response', function (ns) {
    return ns.module('Model').extend({
        'stringFormat': function (string) {
            var that = this;
            return (string || '').replace(/{(.+?)}/g, function (match, prop) {
                return that.attr(['order.order_data', prop].join('.')) || match;
            });
        },
        'setConnector': function (connector) {
            this.connector = connector;
            return this;
        },
        'setUID': function (uid) {
            this.uid = uid;
            return this;
        },
        'getUID': function () {
            return this.uid;
        },
        'formDataSubmit': function (url, data, target, method) {
            var action = this.stringFormat(url);
            var form = this.prepareForm(action, data, target, method);
            var body = this.utils.querySelector('body');
            body.appendChild(form);
            form.submit();
            form.parentNode.removeChild(form);
        },
        'inProgress': function () {
            return this.attr('order.in_progress');
        },
        'readyToSubmit': function () {
            return this.attr('order.ready_to_submit');
        },
        'waitForResponse': function () {
            return this.attr('order.pending');
        },
        'needVerifyCode': function () {
            return this.attr('order.need_verify_code');
        },
        'redirectUrl': function () {
            if (this.attr('url')) {
                location.assign(this.attr('url'));
                return true;
            }
            return false;
        },
        'submitToMerchant': function () {
            var ready = this.attr('order.ready_to_submit');
            var url = this.attr('model.url') || this.attr('order.response_url');
            var method = this.attr('order.method');
            var data = this.attr('model.send_data') || this.attr('order.order_data');
            if (ready && url && data) {
                this.formDataSubmit(url, data, '_self', method);
                return true;
            }
        },
        'submitForm': function () {
            var method = this.attr('method');
            var url = this.attr('url');
            var data = this.attr('send_data');
            if (url && data) {
                this.formDataSubmit(url, data, '_self', method);
                return true;
            }
            return false;
        },
        'sendResponse': function () {
            var action = this.attr('action');
            if (action === 'submit')
                return this.submitForm();
            if (action === 'redirect')
                return this.redirectUrl();
            return false;
        },
        'prepare3dsData': function () {
            var params = {};
            var data = this.attr('submit3ds');
            if (data['3ds']) {
                params.token = this.attr('token');
                params.uid = this.getUID();
                params.frame = true;
                if (data['send_data'].TermUrl) {
                    data['send_data'].TermUrl = [
                        data['send_data'].TermUrl,
                        this.utils.param(params)
                    ].join('#!!');
                }
            }
            return data;
        },
        'waitOn3dsDecline': function () {
            var data = this.alt('submit3ds.checkout_data', {
                js_wait_on_3ds_decline: false,
                js_wait_on_3ds_decline_duration: 0
            });
            return data.js_wait_on_3ds_decline ? data.js_wait_on_3ds_decline_duration : 0;
        },
        'submit3dsForm': function () {
            if (this.attr('submit3ds.checkout_data')) {
                this.connector.trigger('modal', this.prepare3dsData());
            }
        }
    });
});

$checkout.scope('FormData', function (ns) {
    return ns.module('Module').extend({
        'init': function (form) {
            this.setFormElement(form);
        },
        'setFormElement': function (form) {
            if (this.utils.isElement(form)) {
                this.form = form;
            }
        },
        'getData': function (filter) {
            var params = this.deparam(this.serializeArray());
            return filter === true ? this.utils.cleanObject(params) : params;
        },
        'serializeArray': function () {
            var list = this.utils.toArray(this.form.elements);
            return this.utils.map(list, function (field) {
                if (field.disabled || field.name === '') return;
                if (field.type.match('checkbox|radio') && !field.checked) return;
                return {
                    name: field.name,
                    value: field.value
                };
            });
        },
        'serializeAndEncode': function () {
            return this.utils.map(this.serializeArray(), function (field) {
                return [field.name, encodeURIComponent(field.value)].join('=');
            }).join('&');
        },
        'deparam': function (obj) {
            var prop;
            var result = {};
            var breaker = /[^\[\]]+|\[\]$/g;
            var attr = function (name, value) {
                var i, data = result, last = name.pop(), len = name.length;
                for (i = 0; i < len; i++) {
                    if (!data[name[i]])
                        data[name[i]] = len === i + 1 && last === '[]' ? [] : {};
                    data = data[name[i]];
                }
                if (last === '[]') {
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
    var CSS_FRAME = {
        'width': '1px !important',
        'height': '1px !important',
        'left': '1px !important',
        'bottom': '1px !important',
        'position': 'fixed !important',
        'border': '0px !important'
    };
    return ns.module('Module').extend({
        'defaults': {
            'origin': 'https://api.fondy.eu',
            'endpoint': {
                'gateway': '/checkout/v2/index.html'
            }
        },
        'init': function (params) {
            this.initParams(params);
        },
        'url': function (type, url) {
            return [this.params.origin, this.params.endpoint[type] || '/', url || ''].join('');
        },
        'initParams': function (params) {
            this.params = this.utils.extend({}, this.defaults, params);
            this.setOrigin(this.params.origin);
            this.loaded = false;
            this.created = false;
        },
        'setOrigin': function (origin) {
            if (this.utils.isString(origin)) {
                this.params.origin = origin;
            }
            return this;
        },
        'scope': function (callback) {
            callback = this.proxy(callback);
            if (this._createFrame().loaded === true) {
                callback();
            } else {
                this.on('checkout.api', callback);
            }
        },
        'request': function (model, method, params) {
            var defer = ns.get('Deferred');
            var data = {
                uid: this.connector.getUID(),
                action: model,
                method: method,
                params: params || {}
            };
            this.connector.send('request', data);
            this.connector.on(data.uid, this.proxy(function (ev, response, model, action) {
                model = ns.get('Response', response);
                model.setUID(data.uid);
                model.setConnector(this.connector);
                action = 'resolveWith';
                if (model.attr('submit3ds')) {
                    action = 'notifyWith';
                }
                if (model.attr('error')) {
                    action = 'rejectWith';
                }
                defer[action](this, [model]);
            }));
            return defer;
        },
        '_getFrameStyles': function () {
            var props = [];
            this.utils.forEach(CSS_FRAME, function (value, key) {
                props.push([key, value].join(':'));
            });
            return props.join(';');
        },
        '_loadFrame': function (url) {
            this.iframe = this.utils.createElement('iframe');
            this.addAttr(this.iframe, {'allowtransparency': true, 'frameborder': 0, 'scrolling': 'no'});
            this.addAttr(this.iframe, {'src': url});
            this.addAttr(this.iframe, {'style': this._getFrameStyles()});
            this.body = this.utils.querySelector('body');
            if (this.body.firstChild) {
                this.body.insertBefore(this.iframe, this.body.firstChild);
            } else {
                this.body.appendChild(this.iframe);
            }
            return this.iframe;
        },
        '_createFrame': function () {
            if (this.created === false) {
                this.created = true;
                this.iframe = this._loadFrame(this.url('gateway'));
                this.connector = ns.get('Connector', {target: this.iframe.contentWindow});
                this.connector.on('load', this.proxy('_onLoadConnector'));
                this.connector.on('modal', this.proxy('_onOpenModal'));
            }
            return this;
        },
        '_onOpenModal': function (xhr, data) {
            this.modal = ns.get('Modal', {checkout: this, data: data});
            this.modal.on('close', this.proxy('_onCloseModal'));
        },
        '_onCloseModal': function (modal, data) {
            this.trigger('modal.close', modal, data);
        },
        '_onLoadConnector': function () {
            this.loaded = true;
            this.connector.off('load');
            this.trigger('checkout.api');
            this.off('checkout.api');
        }
    });
});

$checkout.scope('Widget', function (ns) {
    return ns.module('Api').extend({
        'init': function (params) {
            this.initParams(params);
            this.initWidget();
        },
        'initWidget': function () {
            this.initOptions(this.params.options);
            if (this.utils.isString(this.params.element)) {
                this.initElement(this.params.element);
            }
        },
        'initOptions': function () {
            if (this.utils.isPlainObject(this.params.options)) {
                this.params.options = this.params.options || {};
            }
        },
        'initElement': function (el) {

        },
        'addSelectorEvent': function (el, ev, cb) {
            this.each(this.utils.querySelectorAll(el), function (cx, element) {
                this.addEvent(element, ev, cb);
            });
            return this;
        },
        'getRequestParams': function () {
            return {};
        },
        'sendRequest': function (el, ev) {
            if (ev.defaultPrevented) return;
            ev.preventDefault();
            this.trigger('request', this.getRequestParams(el));
            this.scope(function () {
                this.request('api.checkout.form', 'request', this.getRequestParams(el))
                    .done(this.proxy('onSuccess'))
                    .fail(this.proxy('onError'))
                    .progress(this.proxy('onProgress'));
            });
        },
        'onProgress': function (cx, model) {
            this.trigger('progress', model);
        },
        'onSuccess': function (cx, model) {
            model.sendResponse();
            model.submitToMerchant();
            this.trigger('success', model);
        },
        'onError': function (cx, model) {
            this.trigger('error', model);
        }
    });
});

$checkout.scope('FormWidget', function (ns) {
    return ns.module('Widget').extend({
        'initElement': function (el) {
            this.addSelectorEvent(el, 'submit', 'sendRequest');
        },
        'getRequestParams': function (el) {
            return this.utils.extend({}, this.params.options, ns.get('FormData', el).getData());
        }
    });
});

$checkout.scope('ButtonWidget', function (ns) {
    return ns.module('Widget').extend({
        'attributes': {},
        'initElement': function (el) {
            if (this.utils.isPlainObject(this.params.attributes)) {
                this.utils.extend(this.attributes, this.params.attributes);
            }
            this.addSelectorEvent(el, 'click', 'sendRequest');
        },
        'getRequestParams': function (el) {
            return this.utils.extend({}, this.params.options, this.getElementData(el));
        },
        'getElementData': function (el) {
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

$checkout.scope('PaymentRequest', function (ns) {

    var METHODS = [
        ['google',{
            supportedMethods: ['https://google.com/pay'],
            data: {
                'apiVersion': 2,
                'apiVersionMinor': 0,
                'allowedPaymentMethods': [
                    {
                        'type': 'CARD',
                        'parameters': {
                            "allowedAuthMethods": ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                            "allowedCardNetworks": ['MASTERCARD', 'VISA','AMEX', 'DISCOVER', 'INTERAC', 'JCB']
                        }
                    }
                ]
            }
        }],
        ['apple',{'supportedMethods': ['https://apple.com/apple-pay']}],
        ['card',{'supportedMethods': ['basic-card']}]
    ];

    return ns.module('Module').extend({
        'config': {
            payment_system: '',
            methods: [],
            details: {},
            options: {}
        },
        'init': function (params) {
            this.params = params;
        },
        'setConfig': function (config) {
            this.config = config;
            return this;
        },
        'setMerchant':function(merchant){
            this.merchant = merchant;
        },
        'setApi': function (api) {
            if (isInstanceOf('Api', api)) {
                this.api = api;
            }
        },
        'getSupportedMethod': function () {
            var details = {total: {label: 'Total', amount: {currency: 'USD', value: '0.00'}}};
            (function(module,list, index){
                var request,method,config;
                var callback = arguments.callee;
                var item     = list[index] || false;
                if( item === false ) return item;
                index  = (index || 0 ) + 1;
                method = item[0];
                config = item[1];
                try {
                    request = new PaymentRequest([config], details);
                    request.canMakePayment().then(function (status) {
                        if( status ){
                            module.trigger('supported',method);
                        } else {
                            callback(module,list,index);
                        }
                    });
                } catch (e) {
                    callback(module,list,index);
                }
            })(this,METHODS,0);
        },
        'modelRequest': function (method, params, callback, failure) {
            if (isInstanceOf('Api', this.api)) {
                this.api.scope(this.proxy(function(){
                    this.api.request('api.checkout.pay', method, params)
                        .done(this.proxy(callback)).fail(this.proxy(failure));
                }));
            }
        },
        'getOrderId': function(){
            var list = ['order'];
            list.push(String(Math.round(Math.random() * 1e5)));
            list.push(String(Math.round(Math.random() * 1e5)));
            list.push(String(Math.round(Math.random() * 1e5)));
            return list.join('-');
        },
        'getRequest': function () {
            var request = null, module  = this, defer = ns.get('Deferred') , params = this.params;
            try {
                this.config.details.id = this.getOrderId();
                request = new PaymentRequest(this.config.methods,this.config.details,this.config.options);
                this.addEvent(request, 'merchantvalidation', 'merchantValidation');
                request.canMakePayment().then(function(status){
                    request.show().then(function(response){
                        response.complete('success').then(function(result){
                            defer.resolveWith(module,[response,result])
                        });
                    }).catch(function(e){
                        defer.rejectWith(module,[{code:e.code,message:e.message},request]);
                    })
                }).catch(function(e){
                    defer.rejectWith(module,[{code:e.code,message:e.message},request]);
                });
            } catch (e) {
                defer.rejectWith(module,[{code:e.code,message:e.message},request]);
            }
            return defer;
        },
        'pay': function () {
            this.getRequest().done(function(response){
                this.trigger('complete',{
                    payment_system: this.config.payment_system,
                    data: response.details
                });
            }).fail(function(error){
                this.trigger('error',error);
                if( this.params.embedded === true ){
                    location.reload();
                    this.trigger('reload',this.params);
                }
            });
        },
        'appleSession': function (params) {
            var defer = ns.get('Deferred');
            this.modelRequest('session', params, function (c, model) {
                defer.resolveWith(this,[model.serialize()]);
            }, function(c,model) {
                defer.rejectWith(this,[model]);
            });
            return defer;
        },
        'merchantValidation': function (cx, event) {
            this.appleSession({
                url: event['validationURL'] ,
                domain: location['host'] ,
                merchant_id: this.merchant
            }).done(function(session){
                try {
                    event.complete(session.data);
                } catch (error) {
                    this.trigger('error',error);
                }
            }).fail(function(error){
                this.trigger('error',error);
            });
        }
    });
});

$checkout.scope('PaymentButton', function (ns) {

    var CSS_CONTAINER = {
        'border': '0 !important',
        'margin': '0 !important',
        'padding': '0 !important',
        'display': 'block !important',
        'background': 'transparent !important',
        'overflow': 'hidden !important',
        'position': 'relative !important',
        'opacity': '1 !important',
        'height': '0 !important',
        'outline': 'none !important'
    };

    var CSS_FRAME = {
        'border': 'none !important',
        'margin': '0 !important',
        'padding': '0 !important',
        'display': 'block !important',
        'width': '1px !important',
        'min-width': '100% !important',
        'background': 'transparent !important',
        'position': 'relative !important',
        'opacity': '0 !important',
        'overflow': 'hidden !important',
        'height': '100% !important',
        'outline': 'none !important',
    };

    var ATTR_FRAME = {
        'scrolling': 'no',
        'frameborder': 0,
        'allowtransparency': true,
        'allowpaymentrequest': true
    };

    return ns.module('Module').extend({
        'defaults': {
            origin: 'https://api.fondy.eu',
            endpoint: {
                'gateway': '/checkout/v2/index.html',
                'button': '/checkout/v2/button/index.html'
            },
            style: {
                height: 38,
                type: 'long',
                color: 'black'
            },
            data: {}
        },
        'init': function (params) {
            this.initParams(params);
            this.initElement();
            this.initApi();
            this.initPaymentRequest();
        },
        'initParams': function (params) {
            this.params = this.utils.extend({},this.defaults, params);
        },
        'initApi': function () {
            if(isInstanceOf('Api',this.params.api)){
                this.api = this.params.api;
                delete this.params['api'];
            } else {
                this.api = ns.get('Api',{
                    origin:this.params.origin,
                    endpoint: this.params.endpoint
                });
            }
        },
        'endpointUrl': function (type, url) {
            return [this.params.origin, this.params.endpoint[type] || '/', url || ''].join('');
        },
        'initElement': function () {
            this.element = this.utils.querySelector(this.params.element);
            this.container = this.utils.createElement('div');
            this.addCss(this.container, CSS_CONTAINER);
            this.element.appendChild(this.container);
        },
        'initPaymentRequest': function () {
            this.payment = ns.get('PaymentRequest');
            this.payment.getSupportedMethod();
            this.payment.setApi(this.api);
            this.payment.setMerchant(this.params.data.merchant_id);
            this.payment.on('complete', this.proxy('onToken'));
            this.payment.on('error', this.proxy('onError'));
            this.payment.on('log', this.proxy('onLog'));
            this.payment.on('supported', this.proxy('initFrame'));
            this.payment.on('reload', this.proxy('onReload'));
        },
        'initFrame': function (cx, method) {
            this.method = method;
            this.frame = this.utils.createElement('iframe');
            this.addCss(this.frame, CSS_FRAME);
            this.addAttr(this.frame, ATTR_FRAME);
            this.addAttr(this.frame, {
                src: this.endpointUrl('button')
            });
            this.container.appendChild(this.frame);
            this.initConnector();
        },
        'initConnector': function () {
            this.connector = ns.get('Connector', {target: this.frame.contentWindow});
            this.connector.on('event', this.proxy('onEvent'));
            this.connector.on('click', this.proxy('onClick'));
            this.connector.on('show', this.proxy('onShow'));
            this.connector.on('hide', this.proxy('onHide'));
            this.connector.on('log', this.proxy('onLog'));
            this.connector.on('pay', this.proxy('onPay'));
            this.connector.on('complete', this.proxy('onToken'));
            this.connector.on('error', this.proxy('onError'));
            this.connector.on('reload', this.proxy('onReload'));
            this.addEvent(this.frame, 'load', function () {
                this.update({});
            });
        },
        'getConfigParams': function (data) {
            var params = {method: this.method, data: {}, style: {}};
            this.utils.extend(params.data, this.params.data);
            this.utils.extend(params.style, this.params.style);
            if (this.utils.isPlainObject(data)) {
                this.utils.extend(params,data);
            }
            return params;
        },
        'update': function (params) {
            this.utils.extend(this.params,this.getConfigParams(params));
            this.connector.send('options',this.params);
            this.api.scope(this.proxy(function () {
                this.api.request('api.checkout.pay','get',this.params.data)
                    .done(this.proxy(function (cx,model){
                        this.connector.send('config',model.data);
                    })).fail(this.proxy(function (cx, model) {
                        this.connector.send('config', model.data);
                    }));
            }));
        },
        'callback': function (model) {
            var params = this.utils.extend({}, this.params.data, model.serialize());
            this.api.scope(this.proxy(function(){
                this.api.request('api.checkout.form','request',params)
                    .done(this.proxy('onSuccess'))
                    .fail(this.proxy('onError'));
            }));
        },
        'process': function (callback) {
            this.callback = callback;
            return this;
        },
        'validate': function(callback){
            this.validateCallback = (function(context){
                return function(resolve){
                    if( context.validationProgress === true ) return false;
                    context.validationProgress = true;
                    callback(function(){
                        context.validationProgress = false;
                        resolve.call(context);
                    });
                }
            })(this);
        },
        'click': function(){
            if( this.validateCallback ){
                this.validateCallback(function(){
                    this.connector.send('click', {});
                });
            } else {
                this.connector.send('click', {});
            }
        },
        'cssUnit': function (value, unit) {
            return String(value || 0).concat(unit || '').concat(' !important')
        },
        'onClick': function () {
            this.click();
        },
        'onToken': function (c, data) {
            this.callback(ns.get('PaymentRequestModel', data));
        },
        'onSuccess': function (c, data) {
            this.trigger('success', data);
        },
        'onError': function (c, data) {
            this.trigger('error', data);
        },
        'onReload': function(c,data){
            this.trigger('reload', data);
        },
        'onShow': function () {
            this.addCss(this.frame, {
                'transition': 'opacity 0.6s 0.4s ease-out',
                'opacity': this.cssUnit(1)
            });
            this.addCss(this.container, {
                'transition': 'height 0.2s ease-out',
                'height': this.cssUnit(this.params.style.height, 'px')
            });
            this.trigger('show', {});
        },
        'onHide': function () {
            this.addCss(this.frame, {
                'transition': 'opacity 0.4s ease-out',
                'opacity': this.cssUnit(0)
            });
            this.addCss(this.container, {
                'transition': 'height 0.2s 0.4s ease-out',
                'height': this.cssUnit(0, 'px')
            });
            this.trigger('hide', {});
        },
        'onEvent': function (c, event) {
            this.trigger('event', event);
            this.trigger(event.name, event.data);
        },
        'onLog': function (c, result) {
            this.trigger('log',{
                event: 'log',
                result: result
            });
        },
        'onPay': function (c, data) {
            this.payment.setConfig(data);
            this.payment.pay();
        }
    });
});

$checkout.scope('PaymentContainer', function (ns) {
    return ns.module('Module').extend({
        'defaults': {
            element: null,
            method: 'card',
            data: {
                lang: 'en'
            },
            style: {

            }
        },
        'init': function (params) {
            this.initParams(params);
            this.initElement();
        },
        'initParams': function (params) {
            this.params = this.utils.extend({}, this.defaults, params);
        },
        'initElement': function () {
            var element = this.utils.querySelector(this.params.element);
            var connector = ns.get('Connector', {target: window.parent});
            var payment = ns.get('PaymentRequest',{
                embedded: true
            });
            payment.on('complete', this.proxy(function (cx, data) {
                connector.send('complete',data);
            }));
            payment.on('reload', this.proxy(function (cx, data) {
                connector.send('reload',data);
            }));
            payment.on('error', this.proxy(function (cx, data) {
                connector.send('error',data);
            }));
            connector.on('click', this.proxy(function () {
                if (!element.classList.contains('pending')) {
                    if (this.params.method === 'apple') {
                        connector.send('pay', payment.config);
                    } else {
                        payment.pay();
                    }
                }
            }));
            connector.on('options', this.proxy(function (cx, data) {
                this.utils.extend(this.params,{
                    method: data.method,
                    style: data.style,
                    data: data.data,
                    css: data.css
                });
                element.setAttribute('class', '');
                element.classList.add('button');
                element.classList.add('pending');
                if (this.params.method) {
                    element.classList.add(this.params.method);
                }
                if (this.params.css) {
                    this.utils.forEach(this.params.css,function(value,name){
                        element.style.setProperty(['--',name].join(''),value);
                    });
                }
                if (this.params.style) {
                    element.classList.add(
                        this.params.style.type,
                        this.params.style.color,
                        this.params.data.lang
                    );
                }
            }));
            connector.on('config', this.proxy(function (cx, data) {
                payment.setConfig(data);
                if (data.payment_system && data.methods && data.methods.length > 0) {
                    element.classList.add('ready');
                    element.classList.remove('pending');
                    connector.send('show', {});
                } else {
                    connector.send('hide', {});
                }
            }));
            this.addEvent(element, 'mouseenter', function (cx, event) {
                event.preventDefault();
                element.classList.add('hover');
                connector.send('event', {name: 'button.mouseenter'});
            });
            this.addEvent(element, 'mouseleave', function (cx, event) {
                event.preventDefault();
                element.classList.remove('hover');
                connector.send('event', {name: 'button.mouseleave'});
            });
            this.addEvent(element, 'click', function (cx, event) {
                event.preventDefault();
                connector.send('click', {});
            });
            this.addEvent(element, 'resize', function (cx, event) {
                event.preventDefault();
                this.send('event', {name: 'resize'});
            });
            this.addEvent(element, 'focus', function (cx, event) {
                event.preventDefault();
                element.classList.add('active');
                connector.send('event', {name: 'button.focus'});
            });
            this.addEvent(element, 'blur', function (cx, event) {
                event.preventDefault();
                element.classList.remove('active');
                connector.send('event', {name: 'button.blur'});
            });
        }
    });
});

$checkout.scope('PaymentRequestModel', function (ns) {
    return ns.module('Model').extend({
        'create': function () {
        }
    });
});