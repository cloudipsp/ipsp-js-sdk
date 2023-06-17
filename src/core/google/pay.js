const { Deferred } = require('../deferred')
const { Module } = require('../module')
const { GooglePayApi, GoogleBaseRequest } = require('../config')

const GooglePay = Module.extend({
    id: 'google-payments-api',
    init() {
        this.client = null
        this.wrapper = this.utils.querySelector('head')
        this.defer = Deferred()
    },
    load() {
        if (this.utils.getPath('google.payments.api.PaymentsClient')) {
            return this.defer.resolveWith(this)
        }
        if (this.utils.querySelector('#'.concat(this.id))) {
            return this.defer
        }
        this.script = this.utils.createElement('script')
        this.addAttr(this.script, {
            id: this.id,
            async: true,
            src: GooglePayApi,
        })
        this.utils.isElement(this.wrapper) &&
            this.wrapper.appendChild(this.script)
        this.addEvent(this.script, 'load', 'onLoadSuccess')
        this.addEvent(this.script, 'error', 'onLoadError')
        return this.defer
    },
    show(methods) {
        const method = methods.find(function (item) {
            return item.supportedMethods === 'https://google.com/pay'
        })
        const client = this.getClient({ environment: method.data.environment })
        return client.loadPaymentData(method.data)
    },
    readyToPay(cx, response) {
        if (response.result) {
            this.defer.resolveWith(this)
        }
    },
    onError(cx, error) {
        this.defer.rejectWith(this, error)
    },
    onLoadSuccess() {
        const client = this.getClient()
        if (client)
            client
                .isReadyToPay(GoogleBaseRequest)
                .then(this.proxy('readyToPay'))
                .catch(this.proxy('onError'))
    },
    onLoadError() {
        this.defer.rejectWith(this)
    },
    getClient(options) {
        if (options || this.client === null) {
            const PaymentClient = this.utils.getPath(
                'google.payments.api.PaymentsClient'
            )
            if (PaymentClient) {
                this.client = new PaymentClient(options)
            } else {
                this.onError(null, new Error('Google Client Error'))
            }
        }
        return this.client
    },
})

exports.GooglePay = new GooglePay()
