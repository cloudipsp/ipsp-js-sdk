exports.GooglePayApi = 'https://pay.google.com/gp/p/js/pay.js';

exports.GoogleBaseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
        {
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
            }
        }
    ]
};

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
    'uk'
];

exports.PaymentRequestMethods = [
    ['google', {
        'supportedMethods': ['https://google.com/pay'],
        'data': exports.GoogleBaseRequest
    }],
    ['apple', {'supportedMethods': ['https://apple.com/apple-pay']}],
    ['card', {'supportedMethods': ['basic-card']}]
];

exports.PaymentRequestDetails = {
    total: {
        label: 'Total',
        amount: {
            currency: 'USD',
            value: '0.00'
        }
    }
}
