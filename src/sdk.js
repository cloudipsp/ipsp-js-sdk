(function () {
    var version = '1.0.0';
    var modules  = {};
    var instance = {};
    this.$checkout = function(name,params){
        if (instance[name])
            return instance[name];
        return (instance[name] = arguments.callee.get(name,params||{}) );
    };
    this.$checkout.get = function(name,params) {
        if (!modules[name]) throw Error('module is undefined');
        return new modules[name](params||{});
    };
    this.$checkout.module = function (name) {
        if (!modules[name]) throw Error('module is undefined');
        return modules[name];
    };
    this.$checkout.add = function (name, module) {
        if (modules[name]) {
            throw Error('module already added');
        }
        modules[name] = module;
    };
    this.$checkout.version = function (v) {
        version = v;
        return this;
    };
    this.$checkout._debug_  = (function(){
        return Number(document.cookie.replace(/(?:(?:^|.*;\s*)checkout_debug\s*\=\s*([^;]*).*$)|^.*$/,"$1"));
    })();
    this.$checkout.debug    = function(state){
        document.cookie = ['checkout_debug',Number(state)].join('=');
    };
    this.$checkout.log = function(){
        if(this._debug_ && 'console' in window){
            console.log.apply(console,arguments);
        }
    };
    this.$checkout.factory = function(name,module){
        this.add(name,module(this));
    };
}).call(window || {});
(function () {
    var type = function (o) {
        return ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    };
    this.isObject = function (o) {
        return type(o) === 'object';
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


(function () {
    this.removeElement = function(el){
        el.parentNode.removeChild(el);
    };
})();
(function () {
    this.addEvent = function(el,type,callback){
        if (!el) return false;
        if (el.addEventListener) el.addEventListener(type,callback);
        else if (el.attachEvent) el.attachEvent('on' + type,callback);
    };
})();


$checkout.factory('popupBlocker',function(ns){
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

$checkout.factory('Class',function(ns){
    var init = false;
    var fnTest = /xyz/.test((function(){return 'xyz'}).toString()) ? /\b_super\b/ : /.*/;
    var Class = function(){

    };
    Class.prototype = {
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
    Class.extend = function (instance, name) {
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
        Class.prototype.name = name;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
    return Class;
});

$checkout.factory('Deferred',function(ns){
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
    function D(fn){
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
                pipe: function (done, fail, progress) {
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

        if(isFunction(fn)){
            fn.apply(obj, [obj]);
        }
        return obj;
    }
    D.when = function() {
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
            return (function(args){
                var df = D(),
                    size = args.length,
                    done = 0,
                    rp = new Array(size);	// resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved

                for (var i = 0; i < args.length; i++) {
                    (function(j) {
                        var obj = null;

                        if (args[j].done) {
                            args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); }})
                                .fail(function() { df.reject(arguments); });
                        } else {
                            obj = args[j];
                            args[j] = new Deferred();

                            args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done == size) { df.resolve.apply(df, rp); }})
                                .fail(function() { df.reject(arguments); }).resolve(obj);
                        }
                    })(i);
                }

                return df.promise();
            })(arguments);
        }
    }
    return D;
});


$checkout.factory('Event',function(ns){
    return ns.module('Class').extend({
        init: function () {
            this.events = {};
            this.empty = [];
        },
        on: function (type,callback){
            (this.events[type] = this.events[type] || []).push(callback);
            return this;
        },
        off: function (type, callback) {
            type || (this.events = {});
            var list = this.events[type] || this.empty, i = list.length = callback ? list.length : 0;
            while (i--) callback === list[i][0] && list.splice(i, 1);
            return this;
        },
        trigger:function(type){
            var e = this.events[type] || this.empty, list = e.length > 0 ? e.slice(0, e.length) : e, i = 0, j;
            while(j = list[i++]) j.apply(j,this.empty.slice.call(arguments,1));
            return this;
        }
    });
});

$checkout.factory('Connector',function(ns){
    return ns.module('Class').extend({
        ns: 'crossDomain',
        origin: '*',
        uniqueId: 1,
        init: function(params){
            this.setTarget(params.target);
            this.create();
        },
        create: function () {
            this.listener = ns.get('Event');
            addEvent(window,'message',this.proxy('router'));
        },
        setTarget: function (target) {
            this.target = target;
            return this;
        },
        getUID: function () {
            return ++this.uniqueId;
        },
        unbind: function (action, callback){
            this.listener.off([this.ns,action].join('.'), callback);
        },
        action: function (action,callback){
            this.listener.on([this.ns,action].join('.'),callback);
        },
        publish: function(action,data){
            this.listener.trigger([this.ns,action].join('.'),data);
        },
        router: function(window,ev,response){
            try {
                response = JSON.parse(ev.data);
            } catch (e) {
            }
            if (response.action && response.data){
                this.publish(response.action,response.data);
            }
        },
        send: function (action,data){
            this.target.postMessage(JSON.stringify({
                action: action ,
                data: data
            }),this.origin,[]);
        }
    });
});

$checkout.factory('Api',function(ns){
    return ns.module('Class').extend({
        origin: 'https://api.dev.fondy.eu',
        endpoint: {
            gateway: '/checkout/'
        },
        init: function(){
            this.loaded    = false;
            this.created   = false;
            this.listener  = ns.get('Event');
            this.connector = ns.get('Connector');
            this.params    = {};
        },
        url: function (type, url) {
            return [this.origin,this.endpoint[type]||'/',url||''].join('');
        },
        loadFrame: function (url) {
            this.iframe     = document.createElement('iframe');
            this.iframe.src = url;
            this.iframe.style.display = 'none';
            document.getElementsByTagName('body')[0].appendChild(this.iframe);
            return this.iframe;
        },
        create: function () {
            if( this.created === false ){
                this.created = true;
                this.iframe  = this.loadFrame(this.url('gateway'));
                this.connector.setTarget(this.iframe.contentWindow);
                this.connector.action('load',this.proxy('load'));
                this.connector.action('form3ds',this.proxy('form3ds'));
            }
            return this;
        },
        form3ds: function (xhr, data) {
            this.acsframe = ns.get('AcsFrame',{checkout:this,data:data});
        },
        load: function () {
            this.loaded = true;
            this.listener.trigger('checkout.api');
            this.listener.off('checkout.api');
        },
        scope: function (callback) {
            callback = this.proxy(callback);
            if( this.create().loaded === true ){
                callback();
            } else{
                this.listener.on('checkout.api',callback);
            }
        },
        defer: function () {
            return ns.get('Deferred');
        },
        request: function (model, method, params) {
            var defer   = this.defer();
            var data    = {};
            data.uid    = this.connector.getUID();
            data.action = model;
            data.method = method;
            data.params = params || {};
            this.connector.send('request',data);
            this.connector.action(data.uid, this.proxy(function (ev, response) {
                defer[response.error ? 'rejectWith' : 'resolveWith'](this, [response]);
            }, this));
            return defer;
        }
    });
});


$checkout.factory('StyleSheet', function(ns){
    return ns.module('Class').extend({
        init:function(){
            this.element = document.createElement("style");
            this.element.type = 'text/css';
        },
        append:function(wrapper){
            wrapper.appendChild(this.element);
        },
        value:function(data){
            if (style.styleSheet && !style.sheet) {
                style.styleSheet.cssText = data;
            }
            else {
                try {
                    style.innerHTML = '';
                    style.appendChild(document.createTextNode(data));
                } catch (e) {
                    style.innerHTML = data;
                }
            }
        }
    });
});

$checkout.factory('AcsFrame', function(ns){
    return ns.module('Class').extend({
        name:'acsframe',
        attrs:{
            'frameborder': '0',
            'allowtransparency': 'true',
            'scrolling': 'no'
        },
        styles: {
            'zIndex': '9999',
            'overflowX': 'hidden',
            'border': '0',
            'display': 'block',
            'top': '0px',
            'left': '0px',
            'bottom': '0px',
            'right': '0px',
            'width': '100%',
            'height': '750px'
        },
        init: function (params){
            this.checkout = params.checkout;
            this.data     = params.data;
            this.initModal();
            this.initFrame();
            this.initConnector();
        },
        initFrame: function () {
            this.name = [this.name, Math.round(Math.random() * 1000000000)].join('');
            this.wrapper = document.createElement('div');
            this.iframe  = document.createElement('iframe');
            this.iframe.setAttribute('name',this.name);
            this.iframe.setAttribute('id',this.name);
            this.iframe.className = 'ipsp-modal-iframe';
            this.addAttr(this.iframe,this.attrs);
            this.addCss(this.iframe,this.styles);
            this.form = this.prepareForm(this.data.url, this.data.send_data, this.name );
            this.wrapper.appendChild(this.iframe);
            this.wrapper.appendChild(this.form);
            this.modal.appendChild(this.wrapper);
            this.form.submit();
        },
        initModal: function () {
            this.modal = document.createElement('div');
            this.modal.className = 'ipsp-modal';
            this.addCss(this.modal,{
                'position':'absolute',
                'top':'100px',
                'left':'50%',
                'margin-left':'-340px',
                'width':'680px',
                'z-index':'999999',
                'border-radius':'5px',
                'box-shadow':'0 1px 5px rgba(0,0,0, 0.3)',
                'height':'720px'
            });
            document.querySelector('body').appendChild(this.modal);
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
            this.connector.action('response', this.proxy(function(ev,data){
                this.connector.unbind('response');
                this.checkout.connector.send('request', {
                    uid: data.uid ,
                    action: 'api.checkout.proxy',
                    method: 'send',
                    params: data
                });
                removeElement(this.modal);
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