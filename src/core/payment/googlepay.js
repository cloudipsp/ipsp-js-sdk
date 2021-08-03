var Module = require('../module');
var Api = require('../api');
var Connector = require('../connector');
var Utils = require('../utils')
var Request = require('./request');
var Model = require('../model');

var endpoint = 'https://pay.google.com/gp/p/js/pay.js';

var baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};

var allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];

var allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

var tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        'gateway': 'example',
        'gatewayMerchantId': 'exampleGatewayMerchantId'
    }
};

var baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks
    }
};


var cardPaymentMethod = Utils.extend(
    {},
    baseCardPaymentMethod,
    {
        tokenizationSpecification: tokenizationSpecification
    }
);

var paymentsClient = null;

function getGoogleIsReadyToPayRequest() {
    return Utils.extend(
        {},
        baseRequest,
        {
            allowedPaymentMethods: [baseCardPaymentMethod]
        }
    );
}


function getGooglePaymentDataRequest() {
    var paymentDataRequest = Utils.extend({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
        merchantName: 'Example Merchant'
    };
    return paymentDataRequest;
}

function getGooglePaymentsClient(options) {
    if ( paymentsClient === null ) {
        paymentsClient = new google.payments.api.PaymentsClient(options);
    }
    return paymentsClient;
}

function onGooglePayLoaded(callback) {
    var paymentsClient = getGooglePaymentsClient();
    paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
        .then(function(response) {
            if (response.result) {
                prefetchGooglePaymentData();
                callback(response);
                // @todo prefetch payment data to improve performance after confirming site functionality
                // prefetchGooglePaymentData();
            }
        })
        .catch(function(err) {
            console.error('error',err);
        });
}

function addGooglePayButton(container,click) {
    var paymentsClient = getGooglePaymentsClient();
    var buttonParams   = {
        onClick: click ,
        buttonSizeMode: 'fill'
    }
    var button = paymentsClient.createButton(buttonParams);
    Utils.isElement(container) && container.appendChild(button);
}

function getGoogleTransactionInfo() {
    return {
        countryCode: 'US',
        currencyCode: 'USD',
        totalPriceStatus: 'FINAL',
        totalPrice: '1.00'
    };
}

function prefetchGooglePaymentData() {
    var paymentDataRequest = getGooglePaymentDataRequest();
    var paymentsClient = getGooglePaymentsClient();
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
        currencyCode: 'USD'
    };
    var res = paymentsClient.prefetchPaymentData(paymentDataRequest);
}

function getPaymentDataRequest(){
    var paymentDataRequest = getGooglePaymentDataRequest();
        paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    return paymentDataRequest;
}

function onGooglePaymentButtonClicked(data) {
    var paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(data || getPaymentDataRequest())
        .then(function(paymentData) {
            processPayment(paymentData);
        })
        .catch(function(err) {
            console.error(err);
        });
}

function processPayment(paymentData) {
    console.log(paymentData);
    var paymentToken = paymentData.paymentMethodData.tokenizationData.token;
}

function loadGoogleApi(container,callback){
    var script = document.createElement('script');
    script.async = true;
    script.src = endpoint;
    script.onload = callback;
    Utils.isElement(container) && container.appendChild(script);
}
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var GooglePay = Module.extend({
    'defaults': {
        origin: 'https://api.fondy.eu',
        endpoint: {
            'gateway': '/checkout/v2/index.html'
        },
        data: {}
    },
    'init':function(params){
        this.initParams(params);
        this.initElement();
        this.initApi();
        this.fetch();
    },
    'initParams': function(params){
        this.method = 'google';
        this.params = this.utils.extend({},this.defaults, params);
    },
    'initApi': function (){
        if(this.params.api instanceof Api){
            this.api = this.params.api;
            delete this.params['api'];
        } else {
            this.api = new Api({
                origin:this.params.origin,
                endpoint: this.params.endpoint
            });
        }
    },
    'initElement':function (){
        this.element = this.utils.querySelector(this.params.element);
    },
    'fetch': function(){
        this.api.scope(this.proxy(function () {
            this.api.request('api.checkout.pay','get',this.params.data)
                .done(this.proxy('initModule'))
                .fail(this.proxy('initModule'));
        }));
    },
    /**
     *
     * @param cx
     * @param {Response} model
     */
    'initModule': function(cx,model){
        var container = this.element;
        var params = model.find('methods',function(item){
            return item.attr('supportedMethods') === 'https://google.com/pay'
        });
        console.log('fondy params',params.attr('data'));
        console.log('google params',getPaymentDataRequest());
        loadGoogleApi(container,function(){
            onGooglePayLoaded(function(){
                addGooglePayButton(container,function(){
                    onGooglePaymentButtonClicked(params.attr('data'));
                });
            });
        });
    }
});


module.exports = GooglePay;


