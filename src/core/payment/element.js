const { Module } = require('../module')
const { Connector } = require('../connector')
const {
    ButtonContainerCss,
    ButtonCoverCss,
    ButtonCoverAttrs,
    ButtonFrameCss,
    ButtonFrameAttrs,
} = require('../config')

const { PaymentRequestApi } = require('./request')

exports.PaymentElement = Module.extend({
    defaults: {
        method: null,
        appendTo: null,
        className: 'payment-element',
        origin: 'https://pay.fondy.eu',
        endpoint: '/latest/checkout/v2/button/element.html',
        mode: 'plain',
        color: 'black',
        lang: 'en',
        height: 38,
    },
    init(params) {
        this.params = {}
        this.utils.extend(this.params, this.defaults)
        this.utils.extend(this.params, params)
        this.initElement()
    },
    getElementUrl() {
        return [this.params.origin, this.params.endpoint].join('')
    },
    getElementOptions() {
        return this.utils.param({
            method: this.params.method,
            mode: this.params.mode,
            style: this.params.style,
            color: this.params.color,
            lang: this.params.lang,
        })
    },
    initElement() {
        this.element = this.utils.createElement('div')
        this.iframe = this.utils.createElement('iframe')
        this.button = this.utils.createElement('a')
        this.addCss(this.element, ButtonContainerCss)
        this.addCss(this.button, ButtonCoverCss)
        this.addAttr(this.button, ButtonCoverAttrs)
        this.addCss(this.iframe, ButtonFrameCss)
        this.addAttr(this.iframe, ButtonFrameAttrs)
        this.addAttr(this.iframe, {
            src: [this.getElementUrl(), this.getElementOptions()].join('?'),
        })
        this.addEvent(this.iframe, 'load', 'onloadConnector')
        this.addEvent(this.iframe, 'error', 'errorConnector')
        this.addAttr(this.element, {
            class: this.params.className,
        })
        this.element.appendChild(this.iframe)
        this.element.appendChild(this.button)
    },
    errorConnector() {
        log('frame load error')
    },
    onloadConnector() {
        this.connector = new Connector({
            target: this.iframe.contentWindow,
            origin: this.params.origin,
        })
    },
    send(action, data) {
        if (this.connector) {
            this.connector.send(action, data)
        }
    },
    onEvent(cx, ev) {
        ev.preventDefault()
        if (this.pending) return false
        this.send('event', { type: ev.type })
    },
    onClick() {
        if (this.pending) return false
        this.request.pay(this.params.method)
    },
    onSupported(cx, supported) {
        if (supported.provider.includes(this.params.method)) {
            this.mount()
        }
    },
    onPayload(cx, payload) {
        if (payload.allowed.includes(this.params.method)) {
            this.show()
        }
    },
    onPending(cx, state) {
        this.pending = state
        this.send('pending', { state: state })
    },
    initEvents() {
        this.addEvent(this.button, 'mouseenter', 'onEvent')
        this.addEvent(this.button, 'mouseleave', 'onEvent')
        this.addEvent(this.button, 'blur', 'onEvent')
        this.addEvent(this.button, 'focus', 'onEvent')
        this.addEvent(this.button, 'click', 'onClick')
    },
    setPaymentRequest(request) {
        if (!(request instanceof PaymentRequestApi))
            throw Error('request is not instance of PaymentRequestApi')
        this.request = request
        const onSupported = this.proxy('onSupported')
        const onPayload = this.proxy('onPayload')
        const onPending = this.proxy('onPending')
        this.request.off('supported', onSupported).on('supported', onSupported)
        this.request.off('payload', onPayload).on('payload', onPayload)
        this.request.off('pending', onPending).on('pending', onPending)
        return this
    },
    appendTo(appendTo) {
        const container = this.utils.querySelector(appendTo)
        if (container) container.appendChild(this.element)
        this.initEvents()
        return this
    },
    mount() {
        this.appendTo(this.params.appendTo)
    },
    isMounted() {
        return document.body.contains(this.element)
    },
    show() {
        if (this.isMounted() === false) return this
        this.addCss(this.iframe, {
            transition: 'opacity 0.6s 0.4s ease-out',
            opacity: this.utils.cssUnit(1),
        })
        this.addCss(this.element, {
            transition: 'height 0.2s ease-out',
            height: this.utils.cssUnit(this.params.height, 'px'),
        })
        this.trigger('show', {})
        return this
    },
    hide() {
        if (this.isMounted() === false) return this
        this.addCss(this.iframe, {
            transition: 'opacity 0.4s ease-out',
            opacity: this.utils.cssUnit(0),
        })
        this.addCss(this.element, {
            transition: 'height 0.2s 0.4s ease-out',
            height: this.utils.cssUnit(0, 'px'),
        })
        this.trigger('hide', {})
        return this
    },
})
