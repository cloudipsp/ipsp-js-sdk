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
        this.connector = new Connector({target: this.frame.contentWindow});
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
