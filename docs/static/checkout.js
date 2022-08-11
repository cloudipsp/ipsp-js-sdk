(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$checkout = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var Component = require('./core/component');

var Api = require('./core/api');
var Module = require('./core/module');
var Connector = require('./core/connector');
var Response = require('./core/response');
var PaymentButton = require('./core/payment/button');
var PaymentContainer = require('./core/payment/container');
var FormWidget = require('./core/widget/form');
var ButtonWidget = require('./core/widget/button');
var Utils = require('./core/utils');
var Config = require('./core/config');

Component.add('Api', Api);
Component.add('Connector', Connector);
Component.add('PaymentContainer', PaymentContainer);
Component.add('PaymentButton', PaymentButton);
Component.add('FormWidget', FormWidget);
Component.add('ButtonWidget', ButtonWidget);
Component.add('Response', Response);

module.exports = Component;
module.exports['Api'] = Api;
module.exports['Module'] = Module;
module.exports['Utils'] = Utils;
module.exports['Config'] = Config;
module.exports['Connector'] = Connector;
module.exports['PaymentContainer'] = PaymentContainer;
module.exports['PaymentButton'] = PaymentButton;
module.exports['FormWidget'] = FormWidget;
module.exports['ButtonWidget'] = ButtonWidget;
module.exports['Response'] = Response;

},{"./core/api":2,"./core/component":4,"./core/config":5,"./core/connector":6,"./core/module":12,"./core/payment/button":13,"./core/payment/container":14,"./core/response":16,"./core/utils":18,"./core/widget/button":19,"./core/widget/form":20}],2:[function(require,module,exports){
var Config    = require('./config');
var Deferred  = require('./deferred');
var Module    = require('./module');
var Connector = require('./connector');
var Modal     = require('./modal');
var Response  = require('./response');

/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Api = Module.extend({
    'defaults': {
        'origin': 'https://api.fondy.eu',
        'endpoint': {
            'gateway': '/checkout/v2/index.html'
        },
        'messages':{
            'modalHeader':'Now you will be redirected to your bank 3DSecure. If you are not redirected please refer',
            'modalLinkLabel':'link'
        }
    },
    'init': function (params) {
        this.initParams(params);
    },
    'url': function (type, url) {
        return [this.params.origin, this.params.endpoint[type] || '/', url || ''].join('');
    },
    'extendParams': function(params){
        this.utils.extend(this.params, params);
        return this;
    },
    'initParams': function (params) {
        this.params = this.utils.extend({},this.defaults);
        this.extendParams(params);
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
        var defer = Deferred();
        var data = {
            uid: this.connector.getUID(),
            action: model,
            method: method,
            params: params || {}
        };
        this.connector.send('request', data);
        this.connector.on(data.uid, this.proxy(function (ev, response, model, action) {
            model = new Response(response);
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
    '_loadFrame': function (url) {
        this.iframe = this.utils.createElement('iframe');
        this.addAttr(this.iframe, {'allowtransparency': true, 'frameborder': 0, 'scrolling': 'no'});
        this.addAttr(this.iframe, {'src': url});
        this.addCss(this.iframe,Config.ApiFrameCss);
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
            this.connector = new Connector({
                target: this.iframe.contentWindow,
                origin: this.params.origin
            });
            this.connector.on('load', this.proxy('_onLoadConnector'));
            this.connector.on('modal', this.proxy('_onOpenModal'));
        }
        return this;
    },
    '_onOpenModal': function (xhr, model) {
        this.modal = new Modal({
            checkout: this,
            model: model
        });
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

module.exports = Api;

},{"./config":5,"./connector":6,"./deferred":7,"./modal":10,"./module":12,"./response":16}],3:[function(require,module,exports){
var init = false;
var fnTest = /xyz/.test(function () {
    return 'xyz';
}.toString()) ? /\b_super\b/ : /.*/;
/**
 * @type {ClassObject}
 */
function ClassObject() {

}

ClassObject.prototype._super = function(){

}

ClassObject.prototype.instance = function(params){
    return new this.constructor(params);
}

ClassObject.prototype.proxy = function(fn){
    fn = typeof (fn) == 'string' ? this[fn] : fn;
    return (function (cx, cb) {
        return function () {
            return cb.apply(cx, [this].concat(Array.prototype.slice.call(arguments)))
        };
    })(this, fn);
}

function superMethod(parent,name,method){
    return function () {
        var temp = this._super, result;
        this._super = parent[name];
        result = method.apply(this,arguments);
        this._super = temp;
        return result;
    };
}

function assign(target,instance){
    var prop,proto,parent = target.prototype;
    init = true;
    proto = new target();
    init = false;
    for (prop in instance) {
        if (instance.hasOwnProperty(prop)) {
            if (typeof (parent[prop]) == 'function' &&
                typeof (instance[prop]) == 'function' &&
                fnTest.test(instance[prop])
            ) {
                proto[prop] = superMethod(parent,prop,instance[prop]);
            } else {
                proto[prop] = instance[prop];
            }
        }
    }
    return proto;
}

ClassObject.extend = function extend(instance){
    function Class(){
        if (!init && this['init']) this['init'].apply(this, arguments);
    }
    Class.prototype = assign(this,instance);
    Class.prototype.constructor = Class;
    Class.extend = extend;
    return Class;
}

module.exports = ClassObject;

},{}],4:[function(require,module,exports){
var modules = {};
var instance = {};

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

function Component(name, params){
    if (instance[name]) return instance[name];
    return (instance[name] = newModule(name, params));
}

Component.get = function (name, params) {
    return newModule(name, params);
};

Component.add = function (name, module) {
    addModule(name, module);
    return this;
};


module.exports = Component;

},{}],5:[function(require,module,exports){
exports.GooglePayApi = 'https://pay.google.com/gp/p/js/pay.js';

exports.GoogleBaseRequest = {
    'apiVersion': 2,
    'apiVersionMinor': 0,
    'allowedPaymentMethods': [
        {
            'type': 'CARD',
            'parameters': {
                'allowedAuthMethods': ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                'allowedCardNetworks': ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
            }
        }
    ]
};

exports.GooglePayLanguages = [
    'ar',
    'bg',
    'ca',
    'zh',
    'hr',
    'cs',
    'da',
    'nl',
    'en',
    'et',
    'fi',
    'fr',
    'de',
    'el',
    'id',
    'it',
    'ja',
    'ko',
    'ms',
    'no',
    'pl',
    'pt',
    'ru',
    'sr',
    'sk',
    'sl',
    'es',
    'sv',
    'th',
    'tr',
    'uk'
];

exports.PaymentRequestMethods = [
    ['google', {
        'supportedMethods': ['https://google.com/pay'],
        'data': exports.GoogleBaseRequest
    }],
    ['apple', {'supportedMethods': ['https://apple.com/apple-pay']}],
    ['card', {'supportedMethods': ['basic-card']}]
];

exports.PaymentRequestDetails = {
    'total': {
        'label': 'Total',
        'amount': {
            'currency': 'USD',
            'value': '0.00'
        }
    }
};

exports.ApiFrameCss = {
    'width': '1px !important',
    'height': '1px !important',
    'left': '1px !important',
    'bottom': '1px !important',
    'position': 'fixed !important',
    'border': '0px !important'
};

exports.ButtonFrameCss = {
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
    'z-index':'1 !important'
};

exports.ButtonFrameAttrs = {
    'tabindex':'-1',
    'scrolling': 'no',
    'frameborder': 0,
    'allowtransparency': true,
    'allowpaymentrequest': true
};

exports.ButtonCoverCss = {
    'z-index':'2 !important',
    'position':'absolute !important',
    'left':'0 !important',
    'top':'0 !important',
    'cursor':'pointer !important',
    'outline': 'none !important',
    'width':'100% !important',
    'height':'100% !important'
};

exports.ButtonCoverAttrs = {
    'tabindex':'0',
    'href':'javascript:void(0)'
};

exports.ButtonContainerCss = {
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

exports.ButtonDefaultColor = 'dark';

exports.ButtonColorMap = {
    'dark': 'dark',
    'light': 'light',
    'black': 'dark',
    'white': 'light'
}

exports.ButtonLabelMap = {
    'ar':'',
    'bg':'',
    'ca':'',
    'zh':'',
    'hr':'',
    'cs':'',
    'da':'',
    'nl':'',
    'en':'Pay with',
    'et':'',
    'es':'Comprar con',
    'el':'',
    'fi':'',
    'fr':'Acheter avec',
    'de':'Zahlen über',
    'id':'',
    'it':'Acquista con',
    'ja':'',
    'ko':'',
    'ms':'',
    'no':'',
    'pl':'Zapłać przez',
    'pt':'',
    'ru':'Оплатить через',
    'sr':'',
    'sk':'Zaplatiť cez',
    'sl':'',
    'sv':'',
    'th':'',
    'tr':'',
    'uk':'Оплатити через'
}

},{}],6:[function(require,module,exports){
var Module = require('./module');
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Connector = Module.extend({
    'ns': 'crossDomain',
    'origin': '*',
    'uniqueId': 1,
    'signature': null,
    'init': function (params) {
        this.setTarget(params.target);
        this.setOrigin(params.origin);
        this.create();
    },
    'create': function () {
        this.addEvent(window, 'message', 'router');
    },
    'setOrigin': function(origin){
        this.origin = origin || '*';
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
            if( response.action === 'pay' ) {
                console.log(JSON.stringify(ev))
            }
            this.trigger(response.action, response.data);
        }
    },
    'send': function (action, data, request, options) {
        if(!this.target){
            return;
        }
        request = JSON.stringify({
            action: action,
            data: data
        });
        options = {
            targetOrigin: this.origin,
            delegate: 'payment'
        }
        try{
            this.target.postMessage(request,options);
        } catch(e) {
            this.target.postMessage(request,this.origin,[]);
        }
    }
});


module.exports = Connector;

},{"./module":12}],7:[function(require,module,exports){
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

},{"./utils":18}],8:[function(require,module,exports){
var Class = require('./class');
/**
 * @type {ClassObject}
 * @extends {Class}
 */
var Event = Class.extend({
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

module.exports = Event;

},{"./class":3}],9:[function(require,module,exports){
var Deferred = require('../deferred');
var Module = require('../module');
var config = require('../config');

var GooglePay = Module.extend({
    'id': 'google-payments-api',
    'init': function () {
        this.client = null;
        this.wrapper = this.utils.querySelector('head');
        this.defer = Deferred();
    },
    'load': function () {
        if (this.utils.getPath('google.payments.api.PaymentsClient')) {
            return this.defer.resolveWith(this);
        }
        if (this.utils.querySelector('#'.concat(this.id))) {
            return this.defer;
        }
        this.script = this.utils.createElement('script');
        this.addAttr(this.script, {
            id: this.id,
            async: true,
            src: config.GooglePayApi
        });
        this.utils.isElement(this.wrapper) && this.wrapper.appendChild(this.script);
        this.addEvent(this.script, 'load', 'onLoadSuccess');
        this.addEvent(this.script, 'error', 'onLoadError');
        return this.defer;
    },
    'show': function (methods) {
        var method = methods.find(function (item) {
            return item.supportedMethods === 'https://google.com/pay';
        });
        var client = this.getClient({environment: method.data.environment});
        return client.loadPaymentData(method.data);
    },
    'readyToPay': function (cx, response) {
        if (response.result) {
            this.defer.resolveWith(this);
        }
    },
    'onError': function (cx, error) {
        this.defer.rejectWith(this, error);
    },
    'onLoadSuccess': function () {
        this.getClient().isReadyToPay(config.GoogleBaseRequest)
            .then(this.proxy('readyToPay'))
            .catch(this.proxy('onError'));
    },
    'onLoadError': function () {
        this.defer.rejectWith(this);
    },
    'getClient': function (options) {
        if( options || this.client === null ) {
            var PaymentClient = this.utils.getPath('google.payments.api.PaymentsClient');
            if (PaymentClient) {
                this.client = new PaymentClient(options);
            } else {
                this.onError(null, new Error('Google Client Error'));
            }
        }
        return this.client;
    }
});

module.exports = new GooglePay;

},{"../config":5,"../deferred":7,"../module":12}],10:[function(require,module,exports){
var Module = require('./module');
var Connector = require('./connector');
var Template  = require('./template');
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Modal = Module.extend({
    'init': function (data) {
        this.checkout = data.checkout;
        this.model    = data.model || {};
        this.messages = data.checkout.params.messages || {};
        this.template = new Template('3ds.ejs');
        this.body = this.utils.querySelector('body');
        this.initModal();
        this.initConnector();
    },
    'initModal': function () {
        this.name = ['modal-iframe', this.getRandomNumber()].join('-');
        this.modal = this.utils.createElement('div');
        this.modal.innerHTML = this.template.render({
            model: this.model,
            messages: this.messages
        });
        this.iframe = this.find('.ipsp-modal-iframe');
        this.addAttr(this.iframe, {name: this.name, id: this.name});
        if (this.model['send_data']) {
            this.form = this.prepareForm(this.model['url'], this.model['send_data'], this.name);
            this.modal.appendChild(this.form);
        } else {
            this.iframe.src = this.model['url'];
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
        this.addAttr(this.form,{
            target: '_blank'
        });
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
        this.connector = new Connector({target: this.iframe.contentWindow});
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

module.exports = Modal;

},{"./connector":6,"./module":12,"./template":17}],11:[function(require,module,exports){
var Module = require('./module');
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Model = Module.extend({
    'init': function (data) {
        this.data = data || {};
        this.create();
    },
    'create': function () {

    },
    'eachProps': function(args){
        var name = args[1] ? args[0] : null;
        var callback = args[1] ? args[1] : args[0];
        var list = name ? this.alt(name, []) : this.data;
        return {
            list: list,
            callback: callback
        }
    },
    'each': function () {
        var prop;
        var props = this.eachProps(arguments);
        for (prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                props.callback(this.instance(props.list[prop]), props.list[prop], prop)
            }
        }
    },
    'filter': function(){
        var item,prop;
        var props = this.eachProps(arguments);
        for (prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                item   = this.instance(props.list[prop]);
                if( props.callback(item, props.list[prop], prop) ){
                    return props.list[prop];
                }
            }
        }
    },
    /**
     *
     * @return {boolean|Model}
     */
    'find': function(){
        var item,prop;
        var props = this.eachProps(arguments);
        for (prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                item   = this.instance(props.list[prop]);
                if( props.callback(item, props.list[prop], prop) ){
                    return item;
                }
            }
        }
        return false;
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


module.exports = Model;

},{"./module":12}],12:[function(require,module,exports){
var Class = require('./class');
var Event = require('./event');
var Utils = require('./utils');
/**
 * @type {ClassObject}
 * @extends {Class}
 */
var Module =  Class.extend({
    'utils': Utils,
    'getListener': function () {
        if (!this._listener_) this._listener_ = new Event();
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

module.exports = Module;

},{"./class":3,"./event":8,"./utils":18}],13:[function(require,module,exports){
var Config = require('../config');
var Module    = require('../module');
var Api       = require('../api');
var Connector = require('../connector');
var Response  = require('../response');
var Deferred = require('../deferred');
var Request   = require('./request');
var GooglePay = require('../google/pay')

/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Button = Module.extend({
    'defaults': {
        origin: 'https://api.fondy.eu',
        endpoint: {
            gateway: '/checkout/v2/index.html',
            button: '/checkout/v2/button/index.html'
        },
        style: {
            height: 38,
            mode: 'default',
            type: 'long',
            color: 'black'
        },
        data: {}
    },
    'init': function (params) {
        this.initParams(params);
        this.initElement();
        this.initEvents();
        this.initApi();
        this.initFrame();
        this.initPaymentRequest();
    },
    'initParams': function (params) {
        this.supported = false;
        this.params = this.utils.extend({},this.defaults, params);
    },
    'initApi': function () {
        if(this.params.api instanceof Api){
            this.api = this.params.api;
            delete this.params['api'];
        } else {
            this.api = new Api({
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
        this.cover = this.utils.createElement('a');
        this.addCss(this.cover,Config.ButtonCoverCss);
        this.addAttr(this.cover,Config.ButtonCoverAttrs)
        this.addCss(this.container,Config.ButtonContainerCss);
        this.element.appendChild(this.container);
    },
    'sendButtonEvent': function(cx,ev){
        ev.preventDefault();
        this.connector.send('event',{type:ev.type});
    },
    'initEvents': function(){
        this.addEvent(this.cover, 'mouseenter', 'sendButtonEvent');
        this.addEvent(this.cover, 'mouseleave', 'sendButtonEvent');
        this.addEvent(this.cover, 'blur', 'sendButtonEvent');
        this.addEvent(this.cover, 'focus', 'sendButtonEvent');
        this.addEvent(this.cover, 'click', 'onClick');
    },
    'initPaymentRequest': function () {
        this.payment = new Request({});
        this.payment.on('complete', this.proxy('onToken'));
        this.payment.on('error', this.proxy('onError'));
        this.payment.on('log', this.proxy('onLog'));
        this.payment.on('supported', this.proxy('onSupported'));
        this.payment.on('fallback', this.proxy('onFallback'));
        this.payment.on('reload', this.proxy('onReload'));
        this.payment.setApi(this.api);
        this.payment.setMerchant(this.params.data.merchant_id);
        this.payment.getSupportedMethod();
    },
    'initFrame': function () {
        this.frameLoaded = Deferred();
        this.frame = this.utils.createElement('iframe');
        this.addCss(this.frame,Config.ButtonFrameCss);
        this.addAttr(this.frame,Config.ButtonFrameAttrs);
        this.addAttr(this.frame, {
            src: this.endpointUrl('button')
        });
        this.container.appendChild(this.frame);
        this.container.appendChild(this.cover);
        this.initConnector();
        this.addEvent(this.frame, 'load', function () {
            this.frameLoaded.resetState().resolve();
        });
    },
    'onFrameLoaded': function(){
        this.update({});
    },
    'onFallback': function(){
        this.fallback = true;
        GooglePay.load().then(this.proxy(function(){
            this.onSupported(null, 'google');
        }));
    },
    'onSupported': function(cx, method){
        this.supported = true;
        this.method = method;
        this.frameLoaded.done(this.proxy('onFrameLoaded'));
    },
    'initConnector': function () {
        this.connector = new Connector({
            target: this.frame.contentWindow,
            origin: this.params.origin
        });
        this.connector.on('show', this.proxy('onShow'));
        this.connector.on('hide', this.proxy('onHide'));
        this.connector.on('log', this.proxy('onLog'));
        this.connector.on('pay', this.proxy('onPay'));
        this.connector.on('complete', this.proxy('onToken'));
        this.connector.on('error', this.proxy('onError'));
        this.connector.on('reload', this.proxy('onReload'));
    },
    'getConfigParams': function (data) {
        var params = {method: this.method, data: {}, style: {} , fallback: this.fallback};
        this.utils.extend(params.data, this.params.data);
        this.utils.extend(params.style, this.params.style);
        if (this.utils.isPlainObject(data)) {
            this.utils.extend(params,data);
        }
        return params;
    },
    'send': function(action,data){
        if( this.supported === true ){
            this.connector.send(action,data);
        }
        return this;
    },
    'update': function (params) {
        this.sendOptions(params);
        this.api.scope(this.proxy(function(){
            this.api.request('api.checkout.pay','get',this.params.data)
                .done(this.proxy('sendConfig'))
                .fail(this.proxy('sendConfig'));
        }));
    },
    'sendOptions': function(params){
        this.utils.extend(this.params,this.getConfigParams(params));
        this.send('options',this.params);
    },
    'sendConfig': function(cx,model){
        this.model = model;
        this.model.supportedMethod(this.method);
        this.payment.setConfig(this.model.data);
        this.send('config',this.model.data);
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
        this.onClick();
    },
    'cssUnit': function (value, unit) {
        return String(value || 0).concat(unit || '').concat(' !important')
    },
    'onClick': function () {
        if( this.validateCallback ){
            this.validateCallback(function(){
                this.sendPay();
            });
        } else {
            this.sendPay();
        }
    },
    'sendPay': function(){
        if( this.fallback === true ) {
             GooglePay.show(this.model.data.methods).then(this.proxy(function(cx,details){
                 this.callback(new Response({
                     payment_system: this.model.data.payment_system,
                     data: details
                 }));
             })).catch(this.proxy(function(cx,error){
                 this.trigger('error', {code: error.code, message: error.message});
             }));
        } else {
            this.send('pay',{});
        }
    },
    'onToken': function (c, data) {
        this.callback(new Response(data));
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

module.exports = Button;

},{"../api":2,"../config":5,"../connector":6,"../deferred":7,"../google/pay":9,"../module":12,"../response":16,"./request":15}],14:[function(require,module,exports){
var Config = require('../config');
var Module = require('../module');
var Connector = require('../connector');
var Request = require('./request');

/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Container = Module.extend({
    'defaults': {
        element: null,
        method: 'card',
        data: {
            lang: 'en'
        },
        style: {}
    },
    'init': function (params) {
        this.initParams(params);
        this.initEvents();
    },
    'initParams': function (params) {
        this.params = this.utils.extend({}, this.defaults, params);
        this.element = this.utils.querySelector(this.params.element);
        this.connector = new Connector({target: window.parent});
        this.payment   = new Request({
            embedded: true
        });
    },
    'extendParams': function (params) {
        this.utils.extend(this.params, {
            method: params.method,
            style: params.style,
            data: params.data,
            css: params.css
        });
    },
    'getGoogleLangSupport': function (lang, defaults) {
        return Config.GooglePayLanguages.indexOf(lang) !== -1 ? lang : defaults;
    },
    'getButtonColor': function(color){
        return Config.ButtonColorMap[color] || Config.ButtonDefaultColor;
    },
    'getGoogleSvg': function (color, lang, mode) {
        var format = 'url("{endpoint}/{color}/{mode}/{lang}.svg")';
        var params = {
            endpoint: 'https://www.gstatic.com/instantbuy/svg',
            color: this.getButtonColor(color),
            mode: mode || 'plain',
            lang: lang || 'en'
        };
        if (mode === 'plain') {
            format = 'url("{endpoint}/{color}_gpay.svg")';
        }
        if (mode === 'buy') {
            format = 'url("{endpoint}/{color}/{lang}.svg")';
        }
        return this.utils.stringFormat(format, params)
    },
    'getAppleSvg': function (color, lang, mode) {
        var format = 'url("svg/apple-pay-{color}.svg")';
        var params = {
            color: this.getButtonColor(color)
        };
        return this.utils.stringFormat(format, params);
    },
    'getAppleLabel': function (lang) {
        return Config.ButtonLabelMap[lang || 'en'];
    },
    'addFrameImage': function () {
        var frame = this.utils.querySelector('iframe', this.element) || this.utils.createElement('iframe');
        var url = 'https://pay.google.com/gp/p/generate_gpay_btn_img';
        var style = this.params.style || {};
        var lang = this.getGoogleLangSupport(this.params.data.lang, 'en');
        var query = {
            buttonColor: style.color || 'black',
            browserLocale: lang,
            buttonSizeMode: 'fill'
        };
        var src = [url, this.utils.param(query)].join('?');
        this.addAttr(frame, {
            'scrolling': 'no',
            'frameborder': 0,
            'src': src
        });
        this.element.appendChild(frame);
        this.element.classList.remove('short', 'long');
    },
    'styleButton': function () {
        var element = this.element;
        var params = this.params;
        var method = params.method;
        var style = params.style || {};
        var lang = params.data.lang || 'en';
        var css = params.css || {};
        element.setAttribute('class', '');
        element.classList.add('button','pending');
        if (method === 'card') method = 'google';
        if (method) {
            element.classList.add(method);
        }
        if (lang) {
            element.classList.add(lang);
        }
        if (style.type) {
            element.classList.add(style.type);
        }
        if (style.mode) {
            element.classList.add(style.mode);
        }
        if (style.color) {
            element.classList.add(style.color);
        }
        if (method === 'google') {
            if (style.type === 'short') {
                style.mode = 'plain';
            }
            if (style.mode === 'default') {
                this.addFrameImage();
            } else {
                css.image = this.getGoogleSvg(style.color, lang, style.mode);
            }
        }
        if (method === 'apple') {
            css.image = this.getAppleSvg(style.color);
            css.label = this.getAppleLabel(lang, style.mode);
        }
        if (css) {
            this.utils.forEach(css, function (value, name) {
                element.style.setProperty(['--', name].join(''), value);
            });
        }
    },
    'initEvents': function () {
        this.payment.on('complete', this.proxy(function (cx, data) {
            this.connector.send('complete',data);
        }));
        this.payment.on('reload', this.proxy(function (cx, data) {
            this.connector.send('reload',data);
        }));
        this.payment.on('error', this.proxy(function (cx, data) {
            this.connector.send('error',data);
        }));
        this.connector.on('options', this.proxy(function (cx, data) {
            this.extendParams(data);
            this.styleButton();
        }));
        this.connector.on('pay', this.proxy(function () {
            if (!this.element.classList.contains('pending')) {
                if (this.params.method === 'apple') {
                    this.connector.send('pay', this.payment.config);
                } else {
                    this.payment.pay();
                }
            }
        }));
        this.connector.on('config', this.proxy(function (cx, data) {
            this.payment.setConfig(data);
            if (data.payment_system && data.methods && data.methods.length > 0) {
                this.element.classList.remove('pending');
                this.element.classList.add('ready');
                this.connector.send('show', {});
            } else {
                this.connector.send('hide', {});
            }
        }));
        this.connector.on('event', this.proxy(function (cx, data) {
            if (data.type === 'mouseenter') {
                this.element.classList.add('hover');
            }
            if (data.type === 'mouseleave') {
                this.element.classList.remove('hover');
            }
            if (data.type === 'focus') {
                this.element.classList.add('active');
            }
            if (data.type === 'blur') {
                this.element.classList.remove('active');
            }
        }))
    }
});

module.exports = Container;

},{"../config":5,"../connector":6,"../module":12,"./request":15}],15:[function(require,module,exports){
var Api = require('../api');
var Module = require('../module');
var GooglePay = require('../google/pay')
var Deferred = require('../deferred');
var Utils = require('../utils');
var Config = require('../config');

var hasPaymentRequest = function () {
    return window.hasOwnProperty('PaymentRequest') && typeof (window.PaymentRequest) === 'function'
}

var getPaymentRequest = function (methods, details, options) {
    var request = null;
    options = options || {};
    details = details || {};
    details.id = Utils.uuid();
    if (hasPaymentRequest()) {
        try {
            request = new PaymentRequest(methods, details, options);
        } catch (e) {
            request = null;
        }
    }
    return request;
};

/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Request = Module.extend({
    'config': {
        payment_system: '',
        fallback: false,
        methods: [],
        details: {},
        options: {}
    },
    'init': function (params) {
        this.params = params || {};
    },
    'setConfig': function (config) {
        this.config = config;
        return this;
    },
    'setMerchant': function (merchant) {
        this.merchant = merchant;
    },
    'setApi': function (api) {
        if (api instanceof Api) {
            this.api = api;
        }
    },
    'isValidConfig': function(){
        return this.config.payment_system && this.config.methods && this.config.methods.length > 0;
    },
    'getSupportedMethod': function () {
        (function (module, list, index) {
            var request, method, config;
            var callback = arguments.callee;
            var item = list[index] || false;
            if (item === false) {
                return module.trigger('fallback');
            }
            index = (index || 0) + 1;
            method = item[0];
            config = item[1];
            request = getPaymentRequest([config], Config.PaymentRequestDetails);
            if( request ){
                request.canMakePayment().then(function (status) {
                    if (status === true) {
                        module.trigger('supported', method);
                    } else {
                        callback(module, list, index);
                    }
                });
            } else {
                callback(module, list, index);
            }
        })(this, Config.PaymentRequestMethods , 0);
    },
    'modelRequest': function (method, params, callback, failure) {
        if (this.api instanceof Api) {
            this.api.scope(this.proxy(function () {
                this.api.request('api.checkout.pay', method, params)
                    .done(this.proxy(callback)).fail(this.proxy(failure));
            }));
        }
    },
    'getRequest': function () {
        var module = this;
        var defer = Deferred();
        var request = getPaymentRequest(
            this.config.methods,
            this.config.details,
            this.config.options
        );
        if (request) {
            this.addEvent(request, 'merchantvalidation', 'merchantValidation');
            request.canMakePayment().then(function () {
                request.show().then(function (response) {
                    response.complete('success').then(function () {
                        defer.resolveWith(module, [response.details])
                    });
                }).catch(function (e) {
                    defer.rejectWith(module, [{code: e.code, message: e.message}]);
                })
            }).catch(function (e) {
                defer.rejectWith(module, [{code: e.code, message: e.message}]);
            });
        } else {
            GooglePay.load().then(this.proxy(function(){
                GooglePay.show(this.config.methods).then(function(details){
                    defer.resolveWith(module, [details])
                }).catch(function(e){
                    defer.rejectWith(module, [{code: e.code, message: e.message}]);
                });
            }));
        }
        return defer;
    },
    'pay': function () {
        this.getRequest().done(function (details) {
            this.trigger('complete', {
                payment_system: this.config.payment_system,
                data: details
            });
        }).fail(function (error) {
            this.trigger('error', error);
            if (this.params.embedded === true) {
                location.reload();
                this.trigger('reload', this.params);
            }
        });
    },
    'appleSession': function (params) {
        var defer = Deferred();
        this.modelRequest('session', params, function (c, model) {
            defer.resolveWith(this, [model.serialize()]);
        }, function (c, model) {
            defer.rejectWith(this, [model]);
        });
        return defer;
    },
    'merchantValidation': function (cx, event) {
        this.appleSession({
            url: event['validationURL'],
            domain: location['host'],
            merchant_id: this.merchant
        }).done(function (session) {
            try {
                event.complete(session.data);
            } catch (error) {
                this.trigger('error', error);
            }
        }).fail(function (error) {
            this.trigger('error', error);
        });
    }
});

module.exports = Request;

},{"../api":2,"../config":5,"../deferred":7,"../google/pay":9,"../module":12,"../utils":18}],16:[function(require,module,exports){
var Model = require('./model');
/**
 * @type {ClassObject}
 * @extends {Model}
 */

var ProxyUrl = 'http://secure-redirect.cloudipsp.com/submit/';


var Response = Model.extend({
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
    'formDataProxy': function(url, data, target, method){
        location.assign([ProxyUrl, JSON.stringify({
            url: url,
            params: data,
            target: target,
            method: method
        })].join('#'));
    },
    'formDataSubmit': function (url, data, target, method) {
        if( url.match(/^http:/) ){
            return this.formDataProxy(url,data,target,method);
        }
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
            this.redirectToUrl(this.attr('url'));
            return true;
        }
        return false;
    },
    'redirectToUrl': function(url){
        location.assign(url);
    },
    'submitToMerchant': function () {
        var ready = this.attr('order.ready_to_submit');
        var url = this.attr('model.url') || this.attr('order.response_url');
        var method = this.attr('order.method');
        var action = this.attr('order.action');
        var data = this.attr('model.send_data') || this.attr('order.order_data');
        if (action && ready && url && data) {
            if( action === 'redirect' || data['get_without_parameters'] === true) {
                this.redirectToUrl(url);
                return true;
            }
            if( action === 'submit') {
                this.formDataSubmit(url, data, '_self', method);
                return true;
            }
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
    },
    'supportedMethod': function(method){
        var item = this.find('methods',function(item){
            return item.alt('supportedMethods','').match(method)
        });
        if( item ){
            this.attr('methods',[item.serialize()])
        } else {
            this.attr('methods',[]);
        }
    }
});

module.exports = Response;

},{"./model":11}],17:[function(require,module,exports){
var Views = require('../views');
var Class = require('./class');
var Utils = require('./utils');

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
/**
 * @type {ClassObject}
 * @extends {Class}
 */
var Template = Class.extend({
    'utils': Utils,
    'init': function (name) {
        this.name = name;
        this.view = {};
        this.output();
    },
    'output': function () {
        this.view.source = Views[this.name];
        this.view.output = template(this.view.source);
    },
    'render': function (data) {
        this.data = data;
        return this.view.output.call(this, this);
    },
    'include': function (name, data) {
        return this.instance(name).render(this.utils.extend(this.data, data));
    }
});

module.exports = Template;

},{"../views":22,"./class":3,"./utils":18}],18:[function(require,module,exports){
var Utils = {
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
    'hasProp': function(o,v){
        return o && o.hasOwnProperty(v);
    },
    'forEach': function (ob, cb, cx) {
        var p;
        for (p in ob)
            if (this.hasProp(ob,p))
                cb.call(cx || null, ob[p], p);
    },
    'map': function (ob, cb, cx) {
        var p, t, r = [];
        for (p in ob)
            if (this.hasProp(ob,p))
                if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                    r[p] = t;
        return r;
    },
    'cleanObject': function (ob) {
        var p;
        for (p in ob) {
            if (this.hasProp(ob,p)) {
                if (ob[p].length === 0) {
                    if (this.isArray(ob)) ob.splice(p, 1);
                    if (this.isPlainObject(ob)) delete ob[p];
                } else if (this.isPlainObject(ob[p])) {
                    this.cleanObject(ob[p]);
                }
            }
        }
        return ob;
    },
    'param': function (data) {
        var s = [];
        var add = function (k, v) {
            v = typeof v === 'function' ? v() : v;
            v = v === null ? '' : v === undefined ? '' : v;
            s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        };
        var ns = function(o,i){
            return (typeof o === 'object' && o ? i : '' )
        };
        var build = function (prefix, ob) {
            if (prefix) {
                if (Utils.isArray(ob)) {
                    Utils.forEach(ob,function(v,k){
                        build(prefix+'['+ns(v,k)+']',v);
                    })
                } else if (Utils.isObject(ob)) {
                    Utils.forEach(ob,function(v,k){
                        build(prefix+'['+k+']',v);
                    });
                } else {
                    add(prefix,ob);
                }
            } else if (Utils.isArray(ob)) {
                Utils.forEach(ob,function(v){
                    add(v.name,v.value);
                });
            } else {
                Utils.forEach(ob,function(v,k){
                    build(k,v);
                });
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
    },
    'uuid': function(){
        var a=0,b='';
        while(a++<36){
            if( a * 51 & 52 ){
                b+= ( a ^ 15 ? 8 ^ Math.random() * ( a ^ 20 ? 16 : 4 ) : 4 ).toString(16);
            } else {
                b+= '-';
            }
        }
        return b;
    },
    'getPath': function(path){
        var props = path.split('.');
        var first = props.shift();
        var value = null;
        if( this.hasProp(window,first) ) {
            value = window[first];
            this.forEach(props,function(name){
                value = this.hasProp(value,name) ? value[name] : null;
            },this)
        }
        return value;
    },
    'stringFormat':function(format,params){
        return (format || '').replace(/{(.+?)}/g, function(match, prop) {
            return params[prop] || match;
        });
    }
};

module.exports = Utils;

},{}],19:[function(require,module,exports){
var Widget = require('./index');
/**
 * @type {ClassObject}
 * @extends {Widget}
 */
var Button = Widget.extend({
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

module.exports = Button;

},{"./index":21}],20:[function(require,module,exports){
var Module = require('../module');
var Widget = require('./index');
/**
 * @type {ClassObject}
 */
var FormData = Module.extend({
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
/**
 * @type {ClassObject}
 * @extends {Widget}
 */
var Form = Widget.extend({
    'initElement': function (el) {
        this.addSelectorEvent(el, 'submit', 'sendRequest');
    },
    'getRequestParams': function (el) {
        return this.utils.extend({}, this.params.options, new FormData(el).getData() );
    }
});

module.exports = Form;

},{"../module":12,"./index":21}],21:[function(require,module,exports){
var Api = require('../api');
/**
 * @type {ClassObject}
 * @extends {Api}
 */
var Widget = Api.extend({
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


module.exports = Widget;

},{"../api":2}],22:[function(require,module,exports){
module.exports = Object.create(null)
module.exports['3ds.ejs'] = '<%=include(\'styles.ejs\')%>\n<div class="ipsp-modal-wrapper">\n    <div class="ipsp-modal">\n        <div class="ipsp-modal-header">\n            <a href="javascript:void(0)" class="ipsp-modal-close"></a>\n            <div class="ipsp-modal-title">\n                <%-data.messages.modalHeader%>\n                <a href=\'javascript:void(0)\'><%-data.messages.modalLinkLabel%></a>\n            </div>\n        </div>\n        <div class="ipsp-modal-content">\n            <iframe src="about:blank" class="ipsp-modal-iframe" frameborder="0" allowtransparency="true"></iframe>\n        </div>\n    </div>\n</div>\n\n'
module.exports['styles.ejs'] = '<style>\n    .ipsp-modal{\n        box-sizing: border-box;\n        margin:100px auto;\n        max-width:680px;\n        background-color:#fff;\n        border-radius:5px;\n        box-shadow:0 2px 2px rgba(0,0,0,0.2);\n        overflow: hidden;\n    }\n    @media (max-width:850px){\n        .ipsp-modal{\n            margin:50px auto;\n        }\n    }\n    @media (max-width:695px){\n        .ipsp-modal{\n            max-width:100%;\n            margin:5px;\n        }\n    }\n    .ipsp-modal-wrapper{\n        box-sizing: border-box;\n        overflow: auto;\n        position:fixed;\n        z-index:99999;\n        left:0;\n        bottom:0;\n        top:0;\n        right:0;\n        background-color: rgba(0,0,0,0.2);\n    }\n    .ipsp-modal-header{\n        box-sizing: border-box;\n        background-color:#fafafa;\n        height:50px;\n        box-shadow:0 0 2px rgba(0,0,0,0.2);\n        border-top-left-radius:5px;\n        border-top-right-radius:5px;\n    }\n    .ipsp-modal-close{\n        box-sizing: border-box;\n        float:right;\n        overflow:hidden;\n        height:50px;\n        text-decoration:none;\n        border-top-right-radius:5px;\n        color:#949494;\n    }\n    .ipsp-modal-close:hover,.ipsp-modal-close:focus,.ipsp-modal-close:active{\n        text-decoration:none;\n        color:#646464;\n    }\n    .ipsp-modal-close:before{\n        content:"×";\n        font-size:50px;\n        line-height:50px;\n        padding:0 10px;\n    }\n    .ipsp-modal-title{\n        box-sizing: border-box;\n        border-top-left-radius:5px;\n        line-height:20px;\n        height:50px;\n        padding:5px 15px;\n        font-size:12px;\n        display:table-cell;\n        vertical-align: middle;\n    }\n    .ipsp-modal-content{\n        box-sizing: border-box;\n        border-bottom-left-radius:5px;\n        min-height:650px;\n    }\n    .ipsp-modal-iframe{\n        overflow-x: hidden;\n        border: 0;\n        display: block;\n        width: 100%;\n        height: 750px;\n    }\n\n</style>\n'
module.exports['trustly.ejs'] = '<%=include(\'styles.ejs\')%>\n<div class="ipsp-modal-wrapper">\n    <div class="ipsp-modal">\n        <div class="ipsp-modal-header">\n            <a href="#" class="ipsp-modal-close"></a>\n            <div class="ipsp-modal-title">\n                <%-data.messages.modalHeader%>\n                <a href=\'javascript:void(0)\'><%-data.messages.modalLinkLabel%></a>\n            </div>\n        </div>\n        <div class="ipsp-modal-content">\n            <iframe src="about:blank" class="ipsp-modal-iframe" frameborder="0" allowtransparency="true"></iframe>\n        </div>\n    </div>\n</div>\n'
},{}]},{},[1])(1)
});
