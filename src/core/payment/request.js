const {Api} = require('../api');
const {Module} = require('../module');
const {GooglePay} = require('../google/pay')
const {Deferred} = require('../deferred');
const {getPaymentRequest} = require("../utils");
const {GoogleBaseRequest, PaymentRequestDetails} = require("../config");

exports.PaymentRequest = Module.extend({
    config: {
        payment_system: '',
        fallback: false,
        methods: [],
        details: {},
        options: {}
    },
    init(params) {
        this.params = params || {};
    },
    setConfig(config) {
        this.config = config;
        return this;
    },
    setMerchant(merchant) {
        this.merchant = merchant;
    },
    setApi(api) {
        if (api instanceof Api) {
            this.api = api;
        }
    },
    isValidConfig() {
        return this.config.payment_system && this.config.methods && this.config.methods.length > 0;
    },
    getPaymentMethods(){
        return [
            ['google', {
                'supportedMethods': 'https://google.com/pay',
                'data': GoogleBaseRequest
            }],
            ['apple', {
                'supportedMethods': 'https://apple.com/apple-pay'
            }]
        ];
    },
    getSupportedMethods() {
        const defer = Deferred();
        const methods = this.getPaymentMethods();
        const details = PaymentRequestDetails;
        const response = {
            fallback: false,
            supported: []
        };
        (function check() {
            const item = methods.shift()
            if (item === undefined) {
                if (response.supported.indexOf('google') === -1) {
                    response.fallback = true
                    response.supported.push('google')
                }
                return defer.resolve(response)
            }
            const config = item.pop()
            const method = item.pop()
            const request = getPaymentRequest([config], details);
            if (request) {
                request.canMakePayment().then(function (status) {
                    if (status === true) response.supported.push(method)
                    check()
                }).catch(check);
            } else {
                check()
            }
        })()
        return defer
    },
    getSupportedMethod() {
        const module = this
        const methods = this.getPaymentMethods();
        const details = PaymentRequestDetails;
        (function next() {
            const item = methods.shift() || false;
            if (item === false) return module.trigger('fallback');
            const method = item.shift();
            const config = item.shift();
            const request = getPaymentRequest([config], details);
            if (request) {
                request.canMakePayment().then(function (status) {
                    if (status === true) {
                        module.trigger('supported', method);
                    } else {
                        next();
                    }
                });
            } else {
                next();
            }
        })();
    },
    modelRequest(method, params, callback, failure) {
        if (this.api instanceof Api) {
            this.api.scope(this.proxy(function () {
                this.api.request('api.checkout.pay', method, params)
                    .done(this.proxy(callback)).fail(this.proxy(failure));
            }));
        }
    },
    getRequest() {
        const module = this;
        const defer = Deferred();
        const request = getPaymentRequest(
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
            this.fallback(defer,this.config.methods)
        }
        return defer;
    },
    pay() {
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
    fallback(defer,methods){
        const module = this
        GooglePay.load().then(function () {
            GooglePay.show(methods).then(function (details) {
                defer.resolveWith(module, [details])
            }).catch(function (e) {
                defer.rejectWith(module, [{code: e.code, message: e.message}]);
            });
        });
    },
    show(params,fallback) {
        const module = this;
        const defer = Deferred();
        if( fallback ) {
            this.fallback(defer,params.methods)
        } else {
            const request = getPaymentRequest(
                params.methods,
                params.details,
                params.options
            );
            if (request) {
                this.addEvent(request, 'merchantvalidation', 'merchantValidation');
            }
        }
        return defer
    },
    appleSession(params) {
        const defer = Deferred();
        this.modelRequest('session', params, function (c, model) {
            defer.resolveWith(this, [model.serialize()]);
        }, function (c, model) {
            defer.rejectWith(this, [model]);
        });
        return defer;
    },
    merchantValidation(cx, event) {
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