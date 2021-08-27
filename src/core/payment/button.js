var Module    = require('../module');
var Api       = require('../api');
var Connector = require('../connector');
var Request   = require('./request');
var Model     = require('./model');
var Deferred = require('../deferred');

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
    'outline': 'none !important'
};

var ATTR_FRAME = {
    'scrolling': 'no',
    'frameborder': 0,
    'allowtransparency': true,
    'allowpaymentrequest': true
};
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Button = Module.extend({
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
        this.initFrame();
        this.initPaymentRequest();
    },
    'initParams': function (params) {
        this.supported = false;
        this.params = this.utils.extend({},this.defaults, params);
        if( this.utils.isPlainObject(this.params.response) ){
            this.params.response = new Model(this.params.response);
        }
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
        this.addCss(this.container, CSS_CONTAINER);
        this.element.appendChild(this.container);
    },
    'initPaymentRequest': function () {
        this.payment = new Request();
        this.payment.getSupportedMethod();
        this.payment.setApi(this.api);
        this.payment.setMerchant(this.params.data.merchant_id);
        this.payment.on('complete', this.proxy('onToken'));
        this.payment.on('error', this.proxy('onError'));
        this.payment.on('log', this.proxy('onLog'));
        this.payment.on('supported', this.proxy('onSupported'));
        this.payment.on('reload', this.proxy('onReload'));
    },
    'initFrame': function () {
        this.frameLoaded = Deferred();
        this.frame = this.utils.createElement('iframe');
        this.addCss(this.frame, CSS_FRAME);
        this.addAttr(this.frame, ATTR_FRAME);
        this.addAttr(this.frame, {
            src: this.endpointUrl('button')
        });
        this.container.appendChild(this.frame);
        this.initConnector();
        this.addEvent(this.frame, 'load', function () {
            this.frameLoaded.resetState().resolve();
        });
    },
    'onSupported': function(cx, method){
        this.supported = true;
        this.method = method;
        this.frameLoaded.done(this.proxy(function(){
            if( this.params.response instanceof Model ){
                this.sendOptions(null,this.params);
                this.sendConfig(null, this.params.response);
            } else {
                this.update({});
            }
        }));
    },
    'initConnector': function () {
        this.connector = new Connector({target: this.frame.contentWindow});
        this.connector.on('event', this.proxy('onEvent'));
        this.connector.on('click', this.proxy('onClick'));
        this.connector.on('show', this.proxy('onShow'));
        this.connector.on('hide', this.proxy('onHide'));
        this.connector.on('log', this.proxy('onLog'));
        this.connector.on('pay', this.proxy('onPay'));
        this.connector.on('complete', this.proxy('onToken'));
        this.connector.on('error', this.proxy('onError'));
        this.connector.on('reload', this.proxy('onReload'));
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
    'send': function(action,data){
        if( this.supported === true ){
            this.connector.send(action,data);
        }
        return this;
    },
    'update': function (params) {
        this.sendOptions(null,params);
        this.api.scope(this.proxy(function () {
            this.api.request('api.checkout.pay','get',this.params.data)
                .done(this.proxy('sendConfig')).fail(this.proxy('sendConfig'));
        }));
    },
    'sendOptions': function(cx,params){
        this.utils.extend(this.params,this.getConfigParams(params));
        this.send('options',this.params);
    },
    'sendConfig': function(cx,model){
        model.supportedMethod(this.method);
        this.send('config',model.data);
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
                this.send('click',{});
            });
        } else {
            this.send('click',{});
        }
    },
    'cssUnit': function (value, unit) {
        return String(value || 0).concat(unit || '').concat(' !important')
    },
    'onClick': function () {
        this.click();
    },
    'onToken': function (c, data) {
        this.callback(new Model(data));
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

module.exports = Button;
