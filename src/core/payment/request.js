var Api = require('../api');
var Module = require('../module');
var GooglePay = require('../google/pay')
var Deferred = require('../deferred');
var Utils = require('../utils');
var Config = require('../config');

var hasPaymentRequest = function () {
    return window.hasOwnProperty('PaymentRequest') && typeof (window.PaymentRequest) === 'function'
}

var getPaymentRequest = function (methods, details, options) {
    var request = null;
    options = options || {};
    details = details || {};
    details.id = Utils.uuid();
    if (hasPaymentRequest()) {
        try {
            request = new PaymentRequest(methods, details, options);
        } catch (e) {
            request = null;
        }
    }
    return request;
};

/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Request = Module.extend({
    'config': {
        payment_system: '',
        fallback: false,
        methods: [],
        details: {},
        options: {}
    },
    'init': function (params) {
        this.params = params || {};
    },
    'setConfig': function (config) {
        this.config = config;
        return this;
    },
    'setMerchant': function (merchant) {
        this.merchant = merchant;
    },
    'setApi': function (api) {
        if (api instanceof Api) {
            this.api = api;
        }
    },
    'isValidConfig': function(){
        return this.config.payment_system && this.config.methods && this.config.methods.length > 0;
    },
    'getSupportedMethod': function () {
        (function (module, list, index) {
            var request, method, config;
            var callback = arguments.callee;
            var item = list[index] || false;
            if (item === false) {
                return module.trigger('fallback');
            }
            index = (index || 0) + 1;
            method = item[0];
            config = item[1];
            request = getPaymentRequest([config], Config.PaymentRequestDetails);
            if( request ){
                request.canMakePayment().then(function (status) {
                    if (status === true) {
                        module.trigger('supported', method);
                    } else {
                        callback(module, list, index);
                    }
                });
            } else {
                callback(module, list, index);
            }
        })(this, Config.PaymentRequestMethods , 0);
    },
    'modelRequest': function (method, params, callback, failure) {
        if (this.api instanceof Api) {
            this.api.scope(this.proxy(function () {
                this.api.request('api.checkout.pay', method, params)
                    .done(this.proxy(callback)).fail(this.proxy(failure));
            }));
        }
    },
    'getRequest': function () {
        var module = this;
        var defer = Deferred();
        var request = getPaymentRequest(
            this.config.methods,
            this.config.details,
            this.config.options
        );
        if (request) {
            this.addEvent(request, 'merchantvalidation', 'merchantValidation');
            request.canMakePayment().then(function () {
                request.show().then(function (response) {
                    response.complete('success').then(function () {
                        defer.resolveWith(module, [response.details])
                    });
                }).catch(function (e) {
                    defer.rejectWith(module, [{code: e.code, message: e.message}]);
                })
            }).catch(function (e) {
                defer.rejectWith(module, [{code: e.code, message: e.message}]);
            });
        } else {
            GooglePay.show(this.config.methods).then(function(details){
                defer.resolveWith(module, [details])
            }).catch(function(e){
                defer.rejectWith(module, [{code: e.code, message: e.message}]);
            });
        }
        return defer;
    },
    'fallback': function(callback){
        GooglePay.load().then(callback);
    },
    'pay': function () {
        this.getRequest().done(function (details) {
            this.trigger('complete', {
                payment_system: this.config.payment_system,
                data: details
            });
        }).fail(function (error) {
            this.trigger('error', error);
            if (this.params.embedded === true) {
                location.reload();
                this.trigger('reload', this.params);
            }
        });
    },
    'appleSession': function (params) {
        var defer = Deferred();
        this.modelRequest('session', params, function (c, model) {
            defer.resolveWith(this, [model.serialize()]);
        }, function (c, model) {
            defer.rejectWith(this, [model]);
        });
        return defer;
    },
    'merchantValidation': function (cx, event) {
        this.appleSession({
            url: event['validationURL'],
            domain: location['host'],
            merchant_id: this.merchant
        }).done(function (session) {
            try {
                event.complete(session.data);
            } catch (error) {
                this.trigger('error', error);
            }
        }).fail(function (error) {
            this.trigger('error', error);
        });
    }
});

module.exports = Request;
