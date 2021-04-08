var Module = require('./module');
var Connector = require('./connector');
var Template  = require('./template');
/**
 * @type ClassObject
 */
var Modal = Module.extend({
    'init': function (params) {
        this.checkout = params.checkout;
        this.data = params.data;
        this.template = new Template('3ds.ejs');
        this.body = this.utils.querySelector('body');
        this.initModal();
        this.initConnector();
    },
    'initModal': function () {
        this.name = ['modal-iframe', this.getRandomNumber()].join('-');
        this.modal = this.utils.createElement('div');
        this.modal.innerHTML = this.template.render(this.data);
        this.iframe = this.find('.ipsp-modal-iframe');
        this.addAttr(this.iframe, {name: this.name, id: this.name});
        if (this.data['send_data']) {
            this.form = this.prepareForm(this.data.url, this.data['send_data'], this.name);
            this.modal.appendChild(this.form);
        } else {
            this.iframe.src = this.data.url;
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