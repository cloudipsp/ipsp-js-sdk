const {Module}    = require('../module');
const {Connector} = require('../connector');
const {ButtonContainerCss, ButtonCoverCss, ButtonCoverAttrs, ButtonFrameCss, ButtonFrameAttrs} = require("../config");

exports.PaymentElement = Module.extend({
    'defaults': {
        origin: 'https://pay.fondy.eu',
        endpoint: '/latest/checkout/v2/button/element.html',
        method: null,
        mode: 'default',
        type: 'long',
        color: 'black',
        lang: 'en',
        height: 38
    },
    'getElementUrl': function () {
        return [this.params.origin, this.params.endpoint].join('')
    },
    'getElementOptions': function(){
        return this.utils.param({
            method: this.params.method,
            mode: this.params.mode,
            type: this.params.type,
            color: this.params.color,
            lang: this.params.lang
        })
    },
    'init': function (params) {
        this.params = {}
        this.extendParams(this.defaults);
        this.extendParams(params);
        this.initElement();
        this.initEvents();
        this.initConfig();
    },
    'sendButtonEvent': function(cx,ev){
        ev.preventDefault();
        this.connector.send('event',{type:ev.type});
    },
    'initEvents': function(){
        this.addEvent(this.button, 'mouseenter', 'sendButtonEvent');
        this.addEvent(this.button, 'mouseleave', 'sendButtonEvent');
        this.addEvent(this.button, 'blur', 'sendButtonEvent');
        this.addEvent(this.button, 'focus', 'sendButtonEvent');
        this.addEvent(this.button, 'click', 'onClick');
    },
    'initConfig': function(){

    },
    'appendTo': function(container){
        container.appendChild(this.element)
        return this;
    },
    'extendParams': function(params){
        this.utils.extend(this.params,params);
    },
    'initConnector': function(){
        this.connector = new Connector({
            target: this.iframe.contentWindow,
            origin: this.params.origin
        });
    },
    'onClick': function(){

    },
    'initElement': function(){
        this.element = this.utils.createElement('div');
        this.button = this.utils.createElement('a');
        this.iframe = this.utils.createElement('iframe');
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
        this.element.appendChild(this.iframe)
        this.element.appendChild(this.button)
    },
    'show': function () {
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
    'hide': function () {
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