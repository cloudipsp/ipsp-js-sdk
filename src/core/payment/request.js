const {Module} = require('../module');
const {Api} = require('../api');
const {GooglePay} = require('../google/pay')
const {Deferred} = require('../deferred');
const {getPaymentRequest} = require("../utils");
const {GoogleBaseRequest, PaymentRequestDetails} = require("../config");

exports.PaymentRequestApi = Module.extend({
    config: {
        payment_system: '',
        fallback: false,
        methods: [],
        details: {},
        options: {}
    },
    supported: {
        fallback: false,
        provider: []
    },
    payload: {
        payment_system: null,
        provider:[]
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
    setSupported(supported){
        this.supported = supported
    },
    setPayload(payload){
        this.payload = payload
    },
    getPaymentMethods(){
        return [
            ['google', {
                'supportedMethods': 'https://google.com/pay',
                'data': GoogleBaseRequest
            }]
            , ['apple', {
                'supportedMethods': 'https://apple.com/apple-pay'
            }]
        ];
    },
    getSupportedMethods() {
        const self = this.constructor
        if( self.defer ) return self.defer
        self.defer = Deferred()
        const methods = this.getPaymentMethods();
        const details = PaymentRequestDetails;
        const response = {
            provider: [],
            fallback: false,
        };
        (function check() {
            const item = methods.shift()
            if (item === undefined) {
                if (response.provider.indexOf('google') === -1){
                    response.fallback = true
                    response.provider.push('google')
                }
                return self.defer.resolve(response)
            }
            const config = item.pop()
            const method = item.pop()
            const request = getPaymentRequest([config], details,{});
            if (request) {
                request.canMakePayment().then(function (status) {
                    if (status === true) response.provider.push(method)
                    check()
                }).catch(check);
            } else {
                check()
            }
        })()
        return self.defer
    },
    getSupportedMethod() {
        this.getSupportedMethods().then((response)=> {
            const [method] = response.provider
            this.setSupported(response);
            this.trigger('supported',method,response.fallback && response.provider.length === 1)
        })
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
        const defer = Deferred();
        const request = getPaymentRequest(
            this.config.methods,
            this.config.details,
            this.config.options
        );
        if (request) {
            this.makePayment(defer,request);
        } else {
            this.makePaymentFallback(defer,this.config.methods)
        }
        return defer;
    },
    makePayment(defer,request){
        const self = this
        this.addEvent(request, 'merchantvalidation', 'merchantValidation');
        request.canMakePayment().then(function () {
            request.show().then(function (response) {
                response.complete('success').then(function () {
                    defer.resolveWith(self, [response.details])
                });
            }).catch(function (e) {
                defer.rejectWith(self, [{code: e.code, message: e.message}]);
            })
        }).catch(function (e) {
            defer.rejectWith(self, [{code: e.code, message: e.message}]);
        });
    },
    makePaymentFallback(defer,methods){
        const self = this
        GooglePay.load().then(()=> {
            GooglePay.show(methods).then( (details) => {
                defer.resolveWith(self, [details])
            }).catch( (e) => {
                defer.rejectWith(self, [{code: e.code, message: e.message}]);
            });
        });
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
    getProviderPayload(method){
        return this.payload.provider[method] || {}
    },
    isMethodSupported(method){
        return this.supported.provider.indexOf(method) !== -1
    },
    isFallbackMethod(method){
        return method === 'google' && this.supported.fallback
    },
    show(method) {
        const defer = Deferred();
        const payload = this.getProviderPayload(method)
        if( this.isMethodSupported(method) === false ){
            return defer.rejectWith(this,[{}]);
        }
        if( this.isFallbackMethod(method) ) {
            this.makePaymentFallback(defer,payload.methods)
        } else {
            const request = getPaymentRequest(
                payload.methods,
                payload.details,
                payload.options
            );
            if (request) {
                this.makePayment(defer, request);
            }
        }
        return defer.done(function (details) {
            this.trigger('complete', {
                payment_system: this.payload.payment_system,
                data: details
            });
        }).fail(function (error) {
            this.trigger('error', error);
            if (this.params.embedded === true) {
                location.reload();
                this.trigger('reload', this.params);
            }
        })
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
        const {validationURL} = event
        const {host} = location
        this.appleSession({
            url: validationURL,
            domain: host,
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