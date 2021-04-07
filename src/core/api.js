var Deferred  = require('./deferred');
var Module    = require('./module');
var Connector = require('./connector');
var Modal     = require('./modal');
var Response  = require('./response');

var CSS_FRAME = {
    'width': '1px !important',
    'height': '1px !important',
    'left': '1px !important',
    'bottom': '1px !important',
    'position': 'fixed !important',
    'border': '0px !important'
};

var Api = Module.extend({
    'defaults': {
        'origin': 'https://api.fondy.eu',
        'endpoint': {
            'gateway': '/checkout/v2/index.html'
        }
    },
    'init': function (params) {
        this.initParams(params);
    },
    'url': function (type, url) {
        return [this.params.origin, this.params.endpoint[type] || '/', url || ''].join('');
    },
    'initParams': function (params) {
        this.params = this.utils.extend({}, this.defaults, params);
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
    '_getFrameStyles': function () {
        var props = [];
        this.utils.forEach(CSS_FRAME, function (value, key) {
            props.push([key, value].join(':'));
        });
        return props.join(';');
    },
    '_loadFrame': function (url) {
        this.iframe = this.utils.createElement('iframe');
        this.addAttr(this.iframe, {'allowtransparency': true, 'frameborder': 0, 'scrolling': 'no'});
        this.addAttr(this.iframe, {'src': url});
        this.addAttr(this.iframe, {'style': this._getFrameStyles()});
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
            this.connector = new Connector({target: this.iframe.contentWindow});
            this.connector.on('load', this.proxy('_onLoadConnector'));
            this.connector.on('modal', this.proxy('_onOpenModal'));
        }
        return this;
    },
    '_onOpenModal': function (xhr, data) {
        this.modal = new Modal({checkout: this, data: data});
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