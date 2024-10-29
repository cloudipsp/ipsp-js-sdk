const { Module } = require('../module')
const { Api } = require('../api')
const { GooglePay } = require('../google/pay')
const { Deferred } = require('../deferred')
const { getPaymentRequest, hasProp, isFunction } = require('../utils')
const { GoogleBaseRequest, PaymentRequestDetails } = require('../config')

const getPaymentMethods = () => {
    return [
        [
            'google',
            {
                supportedMethods: 'https://google.com/pay',
                data: GoogleBaseRequest,
            },
        ],
        [
            'apple',
            {
                supportedMethods: 'https://apple.com/apple-pay',
            },
            () => hasProp(window, 'ApplePaySession'),
        ],
    ]
}

let requestDeferred = null

let requestSupported = {
    fallback: false,
    provider: [],
}

const getSupportedMethods = () => {
    if (requestDeferred) return requestDeferred
    requestDeferred = Deferred()
    const methods = getPaymentMethods()
    const details = PaymentRequestDetails
    ;(function check() {
        const item = methods.shift()
        if (item === undefined) {
            if (requestSupported.provider.indexOf('google') === -1) {
                requestSupported.fallback = true
                requestSupported.provider.push('google')
            }
            return requestDeferred.resolve(requestSupported)
        }
        const method = item.shift()
        const config = item.shift()
        const callback = item.shift()
        if (isFunction(callback) && callback() === false) {
            setTimeout(check, 25)
            return false
        }
        const request = getPaymentRequest([config], details, {})
        if (request) {
            request
                .canMakePayment()
                .then(function (status) {
                    if (status === true) requestSupported.provider.push(method)
                    setTimeout(check, 25)
                })
                .catch(function () {
                    setTimeout(check, 25)
                })
        } else {
            setTimeout(check, 25)
        }
    })()
    return requestDeferred
}

const PaymentRequestInterface = Module.extend({
    config: {
        payment_system: '',
        fallback: false,
        methods: [],
        details: {},
        options: {},
    },
    supported: {
        fallback: false,
        provider: [],
    },
    payload: {
        payment_system: null,
        provider: [],
    },
    params: {},
    getSupportedMethods() {
        return getSupportedMethods().then((supported) => {
            this.setSupported(supported)
            return supported
        })
    },
    init(params) {
        this.params = params || {}
    },
    setSupported(supported) {
        this.supported = supported
        this.trigger('supported', supported)
        return this
    },
    setPayload(payload) {
        this.payload = payload
        this.trigger('payload', payload)
        return this
    },
    setMerchant(merchant) {
        this.merchant = merchant
    },
    setApi(api) {
        if (api instanceof Api) this.api = api
        return this
    },
    getProviderPayload(method) {
        return this.payload.provider[method] || {}
    },
    isMethodSupported(method) {
        return this.supported.provider.indexOf(method) !== -1
    },
    isFallbackMethod(method) {
        return method === 'google' && this.supported.fallback
    },
})
/**
 * @constructor
 */
const PaymentRequestApi = PaymentRequestInterface.extend({
    request(method, params, success, failure) {
        if (this.api) {
            this.api.scope(
                this.proxy(function () {
                    this.api
                        .request('api.checkout.pay', method, params)
                        .done(this.proxy(success))
                        .fail(this.proxy(failure))
                })
            )
        }
    },
    update(data) {
        const defer = Deferred()
        this.request(
            'methods',
            data,
            function (cx, model) {
                this.onUpdate(cx, model)
                defer.resolveWith(this, [model])
            },
            function (cx, model) {
                this.onError(cx, model)
                defer.rejectWith(this, [model])
            }
        )
        return defer
    },
    onUpdate(cx, model) {
        this.setPayload(model.serialize())
    },
    onError(cx, model) {
        this.trigger('error', model)
    },
    isPending() {
        return this.pendingState === true
    },
    setPending(state) {
        this.pendingState = state
        setTimeout(() => {
            this.trigger('pending', state)
        }, 100)
    },
    beforeCallback(defer) {
        defer.resolve()
    },
    setBeforeCallback(callback) {
        if (isFunction(callback)) {
            this.beforeCallback = callback
        }
        return this
    },
    before() {
        if (this.isPending()) return
        this.setPending(true)
        const defer = Deferred()
        defer.always(
            this.proxy(function () {
                this.setPending(false)
            })
        )
        this.beforeCallback(defer)
        return defer
    },
    pay(method) {
        if (this.isPending()) return
        this.setPending(true)
        const payload = this.getProviderPayload(method)
        const response = Deferred()
        response.always(function () {
            this.setPending(false)
        })
        if (this.isMethodSupported(method) === false) {
            return response.rejectWith(this, [{ test: true }])
        }
        if (this.isFallbackMethod(method)) {
            this.makePaymentFallback(response, payload.methods)
        } else {
            this.makeNativePayment(response, payload)
        }
        return response
            .done(function (details) {
                this.trigger('details', {
                    payment_system: this.payload.payment_system,
                    data: details,
                })
            })
            .fail(function (error) {
                this.trigger('error', error)
                if (this.params.embedded === true) {
                    location.reload()
                    this.trigger('reload', this.params)
                }
            })
    },
    makeNativePayment(defer, payload) {
        const self = this
        const request = getPaymentRequest(
            payload.methods,
            payload.details,
            payload.options
        )
        this.addEvent(request, 'merchantvalidation', 'merchantValidation')
        request
            .canMakePayment()
            .then(function () {
                request
                    .show()
                    .then(function (response) {
                        response.complete('success').then(function () {
                            defer.resolveWith(self, [response.details])
                        })
                    })
                    .catch(function (e) {
                        defer.rejectWith(self, [
                            { code: e.code, message: e.message },
                        ])
                    })
            })
            .catch(function (e) {
                defer.rejectWith(self, [{ code: e.code, message: e.message }])
            })
    },
    makePaymentFallback(defer, methods) {
        const self = this
        GooglePay.load().then(() => {
            GooglePay.show(methods)
                .then((details) => {
                    defer.resolveWith(self, [details])
                })
                .catch((e) => {
                    defer.rejectWith(self, [
                        { code: e.code, message: e.message },
                    ])
                })
        })
    },
    appleSession(params) {
        const defer = Deferred()
        this.request(
            'session',
            params,
            function (c, model) {
                defer.resolveWith(this, [model.serialize()])
            },
            function (c, model) {
                defer.rejectWith(this, [model])
            }
        )
        return defer
    },
    merchantValidation(cx, event) {
        const { validationURL } = event
        const { host } = location
        this.appleSession({
            url: validationURL,
            domain: host,
            merchant_id: this.merchant,
        })
            .done(function (session) {
                try {
                    event.complete(session.data)
                } catch (error) {
                    this.trigger('error', error)
                }
            })
            .fail(function (error) {
                this.trigger('error', error)
            })
    },
})

exports.PaymentRequestApi = PaymentRequestApi
