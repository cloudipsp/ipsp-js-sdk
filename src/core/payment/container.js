const { Module } = require('../module')
const { Connector } = require('../connector')
const { PaymentRequestApi } = require('./request')
const {
    GooglePayLanguages,
    ButtonColorMap,
    ButtonDefaultColor,
    ButtonLabelMap,
} = require('../config')

const parseConfig = (config) => {
    const data = {
        payment_system: config.payment_system,
        provider: {},
    }
    const methods = config.methods || []
    const details = config.details || {}
    const options = config.options || {}
    const regex = new RegExp('//([a-z]+)\\.com/')
    methods.forEach(function (item) {
        const match = regex.exec(item.supportedMethods)
        if (match === null) return
        data.provider[match[1]] = {
            methods: [item],
            details: details,
            options: options,
        }
    })
    return data
}

exports.PaymentContainer = Module.extend({
    defaults: {
        element: null,
        method: 'card',
        data: {
            lang: 'en',
        },
        style: {},
    },
    init(params) {
        this.initParams(params)
        this.initEvents()
    },
    initParams(params) {
        this.params = this.utils.extend({}, this.defaults, params)
        this.element = this.utils.querySelector(this.params.element)
        this.connector = new Connector({
            target: window.parent,
        })
        this.payment = new PaymentRequestApi({
            embedded: true,
        })
    },
    extendParams(params) {
        this.utils.extend(this.params, {
            method: params.method,
            style: params.style,
            data: params.data,
            css: params.css,
        })
    },
    getGoogleLangSupport(lang, defaults) {
        return GooglePayLanguages.indexOf(lang) !== -1 ? lang : defaults
    },
    getButtonColor(color) {
        return ButtonColorMap[color] || ButtonDefaultColor
    },
    getGoogleSvg(color, lang, mode) {
        const params = {
            endpoint: 'https://www.gstatic.com/instantbuy/svg',
            color: this.getButtonColor(color),
            mode: mode || 'plain',
            lang: lang || 'en',
        }
        let format = 'url("{endpoint}/{color}/{mode}/{lang}.svg")'
        if (mode === 'plain') {
            format = 'url("{endpoint}/{color}_gpay.svg")'
        }
        if (mode === 'buy') {
            format = 'url("{endpoint}/{color}/{lang}.svg")'
        }
        return this.utils.stringFormat(format, params)
    },
    getAppleSvg(color) {
        const format = 'url("svg/apple-pay-{color}.svg")'
        const params = {
            color: this.getButtonColor(color),
        }
        return this.utils.stringFormat(format, params)
    },
    getAppleLabel(lang) {
        return ButtonLabelMap[lang || 'en']
    },
    addFrameImage() {
        const frame =
            this.utils.querySelector('iframe', this.element) ||
            this.utils.createElement('iframe')
        const url = 'https://pay.google.com/gp/p/generate_gpay_btn_img'
        const style = this.params.style || {}
        const lang = this.getGoogleLangSupport(this.params.data.lang, 'en')
        const query = {
            buttonColor: style.color || 'black',
            browserLocale: lang,
            buttonSizeMode: 'fill',
        }
        const src = [url, this.utils.param(query)].join('?')
        this.addAttr(frame, {
            scrolling: 'no',
            frameborder: 0,
            src: src,
        })
        this.element.appendChild(frame)
        this.element.classList.remove('short', 'long')
    },
    styleButton() {
        let element = this.element
        let params = this.params
        let method = params.method
        let style = params.style || {}
        let lang = params.data.lang || 'en'
        let css = params.css || {}
        element.setAttribute('class', '')
        element.classList.add('button', 'pending')
        if (method === 'card') method = 'google'
        if (method) {
            element.classList.add(method)
        }
        if (lang) {
            element.classList.add(lang)
        }
        if (style.type) {
            element.classList.add(style.type)
        }
        if (style.mode) {
            element.classList.add(style.mode)
        }
        if (style.color) {
            element.classList.add(style.color)
        }
        if (method === 'google') {
            if (style.type === 'short') {
                style.mode = 'plain'
            }
            if (style.mode === 'default') {
                this.addFrameImage()
            } else {
                css.image = this.getGoogleSvg(style.color, lang, style.mode)
            }
        }
        if (method === 'apple') {
            css.image = this.getAppleSvg(style.color)
            css.label = this.getAppleLabel(lang, style.mode)
        }
        if (css) {
            this.utils.forEach(css, function (value, name) {
                element.style.setProperty(['--', name].join(''), value)
            })
        }
    },
    initEvents() {
        this.payment.on(
            'details',
            this.proxy(function (cx, data) {
                this.connector.send('details', data)
                this.connector.send('complete', data)
            })
        )
        this.payment.on(
            'reload',
            this.proxy(function (cx, data) {
                this.connector.send('reload', data)
            })
        )
        this.payment.on(
            'error',
            this.proxy(function (cx, data) {
                this.connector.send('error', data)
            })
        )
        this.connector.on(
            'options',
            this.proxy(function (cx, data) {
                this.extendParams(data)
                this.styleButton()
            })
        )
        this.connector.on(
            'pay',
            this.proxy(function () {
                if (!this.element.classList.contains('pending')) {
                    if (this.params.method === 'apple') {
                        const payload = this.payment.payload || {}
                        const apple = payload.provider['apple'] || {}
                        this.connector.send('pay', {
                            payment_system: payload.payment_system,
                            methods: apple.methods,
                            details: apple.details,
                            options: apple.options,
                        })
                    } else {
                        this.payment
                            .setSupported({
                                fallback: false,
                                provider: ['google'],
                            })
                            .pay('google')
                    }
                }
            })
        )
        this.connector.on(
            'config',
            this.proxy(function (cx, data) {
                this.payment.setPayload((data = parseConfig(data)))
                if (
                    data.payment_system &&
                    Object.keys(data.provider).length > 0
                ) {
                    this.element.classList.remove('pending')
                    this.element.classList.add('ready')
                    this.connector.send('show', {})
                } else {
                    this.connector.send('hide', {})
                }
            })
        )
        this.connector.on(
            'event',
            this.proxy(function (cx, data) {
                if (data.type === 'mouseenter') {
                    this.element.classList.add('hover')
                }
                if (data.type === 'mouseleave') {
                    this.element.classList.remove('hover')
                }
                if (data.type === 'focusin') {
                    this.element.classList.add('active')
                }
                if (data.type === 'focusout') {
                    this.element.classList.remove('active')
                }
            })
        )
    },
})
