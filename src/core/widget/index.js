const {Api} = require('../api');

exports.Widget = Api.extend({
    init(params) {
        this.initParams(params);
        this.initWidget();
    },
    initWidget() {
        this.initOptions(this.params.options);
        if (this.utils.isString(this.params.element)) {
            this.initElement(this.params.element);
        }
    },
    initOptions() {
        if (this.utils.isPlainObject(this.params.options)) {
            this.params.options = this.params.options || {};
        }
    },
    initElement(el) {

    },
    addSelectorEvent(el, ev, cb) {
        this.each(this.utils.querySelectorAll(el), function (cx, element) {
            this.addEvent(element, ev, cb);
        });
        return this;
    },
    getRequestParams() {
        return {};
    },
    sendRequest(el, ev) {
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
    onProgress(cx, model) {
        this.trigger('progress', model);
    },
    onSuccess(cx, model) {
        model.sendResponse();
        model.submitToMerchant();
        this.trigger('success', model);
    },
    onError(cx, model) {
        this.trigger('error', model);
    }
});
