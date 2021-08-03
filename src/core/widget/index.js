var Api = require('../api');
/**
 * @type {ClassObject}
 * @extends {Api}
 */
var Widget = Api.extend({
    'init': function (params) {
        this.initParams(params);
        this.initWidget();
    },
    'initWidget': function () {
        this.initOptions(this.params.options);
        if (this.utils.isString(this.params.element)) {
            this.initElement(this.params.element);
        }
    },
    'initOptions': function () {
        if (this.utils.isPlainObject(this.params.options)) {
            this.params.options = this.params.options || {};
        }
    },
    'initElement': function (el) {

    },
    'addSelectorEvent': function (el, ev, cb) {
        this.each(this.utils.querySelectorAll(el), function (cx, element) {
            this.addEvent(element, ev, cb);
        });
        return this;
    },
    'getRequestParams': function () {
        return {};
    },
    'sendRequest': function (el, ev) {
        if (ev.defaultPrevented) return;
        ev.preventDefault();
        this.trigger('request', this.getRequestParams(el));
        this.scope(function () {
            this.request('api.checkout.form', 'request', this.getRequestParams(el))
                .done(this.proxy('onSuccess'))
                .fail(this.proxy('onError'))
                .progress(this.proxy('onProgress'));
        });
    },
    'onProgress': function (cx, model) {
        this.trigger('progress', model);
    },
    'onSuccess': function (cx, model) {
        model.sendResponse();
        model.submitToMerchant();
        this.trigger('success', model);
    },
    'onError': function (cx, model) {
        this.trigger('error', model);
    }
});


module.exports = Widget;
