const {Module}    = require('../module');
const {Api}       = require('../api');
const {Connector} = require('../connector');
const {Response}  = require('../response');
const {Deferred} = require('../deferred');
const {PaymentRequest}   = require('./request');
const {GooglePay} = require('../google/pay')

const {
    ButtonCoverCss,
    ButtonCoverAttrs,
    ButtonContainerCss,
    ButtonFrameCss,
    ButtonFrameAttrs
} = require('../config');

exports.PaymentButton = Module.extend({
    defaults: {
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
    init(params) {
        this.initParams(params);
        this.initElement();
        this.initEvents();
        this.initApi();
        this.initFrame();
        this.initPaymentRequest();
    },
    initParams(params) {
        this.supported = false;
        this.params = this.utils.extend({},this.defaults, params);
    },
    initApi() {
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
    endpointUrl(type, url) {
        return [this.params.origin, this.params.endpoint[type] || '/', url || ''].join('');
    },
    initElement() {
        this.element = this.utils.querySelector(this.params.element);
        this.container = this.utils.createElement('div');
        this.cover = this.utils.createElement('span');
        this.addCss(this.cover,ButtonCoverCss);
        this.addAttr(this.cover,ButtonCoverAttrs)
        this.addCss(this.container,ButtonContainerCss);
        this.element.appendChild(this.container);
    },
    sendButtonEvent(cx,ev){
        ev.preventDefault();
        this.connector.send('event',{type:ev.type});
    },
    initEvents(){
        this.addEvent(this.cover, 'mouseenter', 'sendButtonEvent');
        this.addEvent(this.cover, 'mouseleave', 'sendButtonEvent');
        this.addEvent(this.cover, 'blur', 'sendButtonEvent');
        this.addEvent(this.cover, 'focus', 'sendButtonEvent');
        this.addEvent(this.cover, 'click', 'onClick');
    },
    initPaymentRequest() {
        this.payment = new PaymentRequest();
        this.payment.on('complete', this.proxy('onToken'));
        this.payment.on('error', this.proxy('onError'));
        this.payment.on('log', this.proxy('onLog'));
        this.payment.on('supported', this.proxy('onSupported'));
        this.payment.on('reload', this.proxy('onReload'));
        this.payment.setApi(this.api);
        this.payment.setMerchant(this.params.data.merchant_id);
        this.payment.getSupportedMethod();
    },
    initFrame() {
        this.frameLoaded = Deferred();
        this.frame = this.utils.createElement('iframe');
        this.addCss(this.frame,ButtonFrameCss);
        this.addAttr(this.frame,ButtonFrameAttrs);
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
    onFrameLoaded(){
        this.update({});
    },
    onSupported(cx, method, fallback){
        this.supported = true;
        this.method = method;
        this.fallback = fallback
        if( this.fallback ) {
            GooglePay.load().then(this.proxy(function(){
                this.frameLoaded.done(this.proxy('onFrameLoaded'));
            }));
        } else {
            this.frameLoaded.done(this.proxy('onFrameLoaded'));
        }
    },
    initConnector() {
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
    getConfigParams(data) {
        const params = {method: this.method, data: {}, style: {} , fallback: this.fallback};
        this.utils.extend(params.data, this.params.data);
        this.utils.extend(params.style, this.params.style);
        if (this.utils.isPlainObject(data)) {
            this.utils.extend(params,data);
        }
        return params;
    },
    send(action,data){
        if( this.supported === true ){
            this.connector.send(action,data);
        }
        return this;
    },
    update(params) {
        this.sendOptions(params);
        this.api.scope(this.proxy(function(){
            this.api.request('api.checkout.pay','get',this.params.data)
                .done(this.proxy('sendConfig'))
                .fail(this.proxy('sendConfig'));
        }));
    },
    sendOptions(params){
        this.utils.extend(this.params,this.getConfigParams(params));
        this.send('options',this.params);
    },
    sendConfig(cx,model){
        this.model = model;
        this.model.supportedMethod(this.method);
        this.payment.setConfig(this.model.data);
        this.send('config',this.model.data);
    },
    callback(model) {
        const params = this.utils.extend({}, this.params.data, model.serialize());
        this.api.scope(this.proxy(function(){
            this.api.request('api.checkout.form','request',params)
                .done(this.proxy('onSuccess'))
                .fail(this.proxy('onError'));
        }));
    },
    process(callback) {
        this.callback = callback;
        return this;
    },
    validate(callback){
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
    click(){
        this.onClick();
    },
    cssUnit(value, unit) {
        return String(value || 0).concat(unit || '').concat(' !important')
    },
    onClick() {
        if( this.validateCallback ){
            this.validateCallback(function(){
                this.sendPay();
            });
        } else {
            this.sendPay();
        }
    },
    sendPay(){
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
    onToken(c, data) {
        this.callback(new Response(data));
    },
    onSuccess(c, data) {
        this.trigger('success', data);
    },
    onError(c, data) {
        this.trigger('error', data);
    },
    onReload(c,data){
        this.trigger('reload', data);
    },
    onShow() {
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
    onHide() {
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
    onLog(c, result) {
        this.trigger('log',{
            event: 'log',
            result: result
        });
    },
    onPay(c, data) {
        this.payment.setConfig(data);
        this.payment.pay();
    }
});


