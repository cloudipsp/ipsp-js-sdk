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
