const { Module } = require('../module')
const { Api } = require('../api')
const { PaymentRequestApi } = require('./request')
const { PaymentElement } = require('./element')
const { forEach } = require('../utils')

exports.PaymentButton = Module.extend({
    defaults: {
        origin: 'https://api.fondy.eu',
        methods: ['apple', 'google'],
        element: null,
        style: {
            height: 38,
            mode: 'default',
            type: 'long',
            color: 'black',
        },
        data: {
            lang: 'en',
        },
    },
    init(params) {
        this.elements = {}
        this.supported = false
        this.params = {
            element: params.element,
            methods: params.methods || this.defaults.methods,
            origin: params.origin || this.defaults.origin,
            endpoint: this.utils.extend(
                {},
                this.defaults.endpoint,
                params.endpoint
            ),
            style: this.utils.extend({}, this.defaults.style, params.style),
            data: this.utils.extend({}, this.defaults.data, params.data),
        }
        this.api =
            params.api instanceof Api
                ? params.api
                : new Api({
                      origin: this.params.origin,
                      endpoint: this.params.endpoint,
                  })
        this.initPaymentRequestApi()
        this.initElements()
        this.update()
    },
    initPaymentRequestApi() {
        this.request = new PaymentRequestApi()
        this.request.setApi(this.api)
        this.request.setMerchant(this.params.data.merchant_id)
        this.request.getSupportedMethods()
        this.request.on('complete', this.proxy('callback'))
    },

    initElements() {
        const style = this.params.style
        const data = this.params.data
        const origin = this.params.origin
        const appendTo = this.params.element
        const request = this.request
        forEach(this.params.methods, function (method) {
            const element = new PaymentElement({
                origin: origin,
                method: method,
                appendTo: appendTo,
                color: style.color,
                mode: style.mode,
                lang: data.lang,
                height: style.height,
            })
            element.setPaymentRequest(request)
        })
    },
    createElement(method) {
        if (this.request.isMethodSupported(method)) return
        const style = this.params.style
        const data = this.params.data
        const element = new PaymentElement({
            origin: this.params.origin,
            method: method,
            color: style.color,
            mode: style.mode,
            lang: data.lang,
            height: style.height,
        })
        element.setPaymentRequest(this.request)
    },
    update(data) {
        this.utils.extend(this.params.data, data || {})
        this.api.scope(() => {
            this.api
                .request('api.checkout.pay', 'methods', this.params.data)
                .done((model) => {
                    this.request.setPayload(model.serialize())
                })
        })
    },
    callback(cx, data) {
        const params = this.utils.extend({}, this.params.data, data)
        this.api.scope(() => {
            this.api
                .request('api.checkout.form', 'request', params)
                .done(this.proxy('onSuccess'))
                .fail(this.proxy('onError'))
        })
    },
    onSuccess(cx, data) {
        console.log(data)
        this.trigger('success', data)
    },
    onError(cx, data) {
        this.trigger('error', data)
    },
})
