var Config = require('../config');
var Module = require('../module');
var Connector = require('../connector');
var Request = require('./request');

var svgLang = function(lang,defaults){
    return Config.GooglePayLanguages.indexOf(lang) !== -1 ? lang : defaults;
}

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
        this.payment = new Request({
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
    'addFrameImage': function(){
        var frame = this.utils.querySelector('iframe',this.element) || this.utils.createElement('iframe');
        var url = 'https://pay.google.com/gp/p/generate_gpay_btn_img';
        var style = this.params.style || {};
        var lang = svgLang(this.params.data.lang,'en');
        var query = {
            buttonColor: style.color || 'black',
            browserLocale: lang,
            buttonSizeMode: 'fill'
        };
        var src = [url,this.utils.param(query)].join('?');
        this.addAttr(frame,{
            'scrolling': 'no',
            'frameborder': 0,
            'src': src
        });
        this.element.appendChild(frame);
        this.element.classList.remove('short','long');
    },
    'styleButton': function () {
        var element = this.element;
        var method = this.params.method;
        var style = this.params.style || {};
        var lang = this.params.data.lang || 'en';
        var css = this.params.css || {};
        element.setAttribute('class', '');
        element.classList.add('button', 'pending');
        if (method === 'card') method = 'google';
        if (method) {
            element.classList.add(method);
        }
        if ( lang ) {
            element.classList.add(lang);
        }
        if(style.type){
            element.classList.add(style.type);
        }
        if(style.mode){
            element.classList.add(style.mode);
        }
        if(style.color){
            element.classList.add(style.color);
        }
        if (css) {
            this.utils.forEach(css, function (value, name) {
                element.style.setProperty(['--', name].join(''), value);
            });
        }
        if(method === 'google' && style.mode === 'default') {
            this.addFrameImage();
        }
    },
    'initEvents': function () {
        this.payment.on('complete', this.proxy(function (cx, data) {
            this.connector.send('complete', data);
        }));
        this.payment.on('reload', this.proxy(function (cx, data) {
            this.connector.send('reload', data);
        }));
        this.payment.on('error', this.proxy(function (cx, data) {
            this.connector.send('error', data);
        }));
        this.connector.on('options', this.proxy(function (cx, data) {
            this.extendParams(data);
            this.styleButton();
        }));
        this.connector.on('config', this.proxy(function (cx, data) {
            if (this.payment.setConfig(data).isValidConfig()) {
                this.element.classList.remove('pending');
                this.element.classList.add('ready');
                this.connector.send('show', {});
            } else {
                this.connector.send('hide', {});
            }
        }));
        this.connector.on('event', this.proxy(function(cx,data){
            if( data.type === 'mouseenter' ) {
                this.element.classList.add('hover');
            }
            if( data.type === 'mouseleave' ) {
                this.element.classList.remove('hover');
            }
            if( data.type === 'focus' ) {
                this.element.classList.add('active');
            }
            if( data.type === 'blur' ) {
                this.element.classList.remove('active');
            }
        }))
    }
});

module.exports = Container;
