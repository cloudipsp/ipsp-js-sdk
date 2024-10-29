exports.ApiOrigin = 'https://api.fondy.eu'

exports.ApiEndpoint = {
    gateway: '/checkout/v2/index.html',
    element: '/checkout/v2/button/element.html',
}

exports.GooglePayApi = 'https://pay.google.com/gp/p/js/pay.js'

exports.GoogleBaseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
        {
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: [
                    'AMEX',
                    'DISCOVER',
                    'INTERAC',
                    'JCB',
                    'MASTERCARD',
                    'VISA',
                ],
            },
        },
    ],
}

exports.GooglePayLanguages = [
    'ar',
    'bg',
    'ca',
    'zh',
    'hr',
    'cs',
    'da',
    'nl',
    'en',
    'et',
    'fi',
    'fr',
    'de',
    'el',
    'id',
    'it',
    'ja',
    'ko',
    'ms',
    'no',
    'pl',
    'pt',
    'ru',
    'sr',
    'sk',
    'sl',
    'es',
    'sv',
    'th',
    'tr',
    'uk',
]

exports.PaymentRequestOptions = {}

exports.PaymentRequestDetails = {
    total: {
        label: 'Total',
        amount: {
            currency: 'USD',
            value: '0.00',
        },
    },
}

exports.ApiFrameCss = {
    width: '1px !important',
    height: '1px !important',
    left: '1px !important',
    bottom: '1px !important',
    position: 'fixed !important',
    border: '0px !important',
}

exports.ButtonFrameCss = {
    border: 'none !important',
    margin: '0 !important',
    padding: '0 !important',
    display: 'block !important',
    width: '1px !important',
    'min-width': '100% !important',
    background: 'transparent !important',
    position: 'relative !important',
    opacity: '0 !important',
    overflow: 'hidden !important',
    height: '100% !important',
    outline: 'none !important',
    'z-index': '1 !important',
}

exports.ButtonFrameAttrs = {
    tabindex: '-1',
    scrolling: 'no',
    frameborder: 0,
    allowtransparency: true,
    allowpaymentrequest: true,
}

exports.ButtonCoverCss = {
    'z-index': '2 !important',
    position: 'absolute !important',
    border: 'none !important',
    background: 'transparent !important',
    left: '0 !important',
    top: '0 !important',
    cursor: 'pointer !important',
    outline: 'none !important',
    width: '100% !important',
    height: '100% !important',
}

exports.ButtonCoverAttrs = {
    role: 'button',
    'aria-pressed': 'false',
}

exports.ButtonContainerCss = {
    border: '0 !important',
    margin: '0 !important',
    padding: '0 !important',
    display: 'block !important',
    background: 'transparent !important',
    'user-select': 'none !important',
    overflow: 'hidden !important',
    position: 'relative !important',
    opacity: '1 !important',
    height: '0 !important',
    width: '100% !important',
    outline: 'none !important',
}

exports.ButtonDefaultColor = 'dark'

exports.ButtonColorMap = {
    dark: 'dark',
    light: 'light',
    black: 'dark',
    white: 'light',
}

exports.ButtonLabelMap = {
    ar: '',
    bg: '',
    ca: '',
    zh: '',
    hr: '',
    cs: '',
    da: '',
    nl: '',
    en: 'Pay with',
    et: '',
    es: 'Comprar con',
    el: '',
    fi: '',
    fr: 'Acheter avec',
    de: 'Zahlen über',
    id: '',
    it: 'Acquista con',
    ja: '',
    ko: '',
    ms: '',
    no: '',
    pl: 'Zapłać przez',
    pt: '',
    ru: 'Оплатить через',
    sr: '',
    sk: 'Zaplatiť cez',
    sl: '',
    sv: '',
    th: '',
    tr: '',
    uk: 'Оплатити через',
}
