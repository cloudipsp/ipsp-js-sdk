const {Module}    = require('../module');
const {Connector} = require('../connector');
const {ButtonContainerCss, ButtonCoverCss, ButtonCoverAttrs, ButtonFrameCss, ButtonFrameAttrs} = require("../config");

exports.PaymentElement = Module.extend({
    defaults: {
        className: 'payment-element',
        origin: 'https://pay.fondy.eu',
        endpoint: '/latest/checkout/v2/button/element.html',
        method: null,
        mode: 'plain',
        style: 'long',
        color: 'black',
        lang: 'en',
        height: 38
    },
    getElementUrl() {
        return [this.params.origin, this.params.endpoint].join('')
    },
    getElementOptions(){
        return this.utils.param({
            method: this.params.method,
            mode: this.params.mode,
            style: this.params.style,
            color: this.params.color,
            lang: this.params.lang
        })
    },
    init(params) {
        this.params = {}
        this.extendParams(this.defaults);
        this.extendParams(params);
        this.initElement();
    },
    sendButtonEvent(cx,ev){
        ev.preventDefault();
        this.connector.send('event',{type:ev.type});
    },
    initElement(){
        this.element = this.utils.createElement('div');
        this.iframe = this.utils.createElement('iframe');
        this.button = this.utils.createElement('a');
        this.addCss(this.element,ButtonContainerCss);
        this.addCss(this.button,ButtonCoverCss);
        this.addAttr(this.button,ButtonCoverAttrs)
        this.addCss(this.iframe,ButtonFrameCss);
        this.addAttr(this.iframe,ButtonFrameAttrs);
        this.addAttr(this.iframe, {
            src: [this.getElementUrl(),this.getElementOptions()].join('?')
        });
        this.addEvent(this.iframe,'load',function(){
            this.initConnector()
        })
        this.addAttr(this.element,{
            class: this.params.className
        })
        this.element.appendChild(this.iframe)
        this.element.appendChild(this.button);
    },
    initEvents(){
        this.addEvent(this.button, 'mouseenter', 'sendButtonEvent');
        this.addEvent(this.button, 'mouseleave', 'sendButtonEvent');
        this.addEvent(this.button, 'blur', 'sendButtonEvent');
        this.addEvent(this.button, 'focus', 'sendButtonEvent');
        this.addEvent(this.button, 'click', 'sendClick');
    },
    setPaymentRequest(request){
        this.request = request
        return this
    },
    appendTo(container){
        container.appendChild(this.element)
        this.initEvents();
        return this;
    },
    extendParams(params){
        this.utils.extend(this.params,params);
    },
    initConnector(){
        this.connector = new Connector({
            target: this.iframe.contentWindow,
            origin: this.params.origin
        });
    },
    sendClick(el,ev){
        this.request.show(this.params.method)
    },
    show() {
        this.addCss(this.iframe, {
            'transition': 'opacity 0.6s 0.4s ease-out',
            'opacity': this.utils.cssUnit(1)
        });
        this.addCss(this.element, {
            'transition': 'height 0.2s ease-out',
            'height': this.utils.cssUnit(this.params.height, 'px')
        });
        this.trigger('show', {});
        return this;
    },
    hide() {
        this.addCss(this.iframe, {
            'transition': 'opacity 0.4s ease-out',
            'opacity': this.utils.cssUnit(0)
        });
        this.addCss(this.element, {
            'transition': 'height 0.2s 0.4s ease-out',
            'height': this.utils.cssUnit(0, 'px')
        });
        this.trigger('hide', {});
        return this
    },
});