var Module     = require('../module');
var Connector  = require('../connector');
var Request    = require('./request');
var Container = Module.extend({
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
        var element   = this.utils.querySelector(this.params.element);
        var connector = new Connector({target: window.parent});
        var payment   = new Request({
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

module.exports = Container;