var Deferred = require('../deferred');
var Module = require('../module');
var config = require('../config');


var GooglePay = Module.extend({
    'init': function () {
        this.client  = null;
        this.wrapper = this.utils.querySelector('head');
        this.defer   = Deferred();
    },
    'load': function(){
        if( this.utils.getPath('google.payments.api.PaymentsClient') ) {
            return this.defer.resolveWith(this);
        }
        this.script = this.utils.createElement('script');
        this.addAttr(this.script,{
            async:true,
            src:config.GooglePayApi
        });
        this.addEvent(this.script,'load', 'onLoadSuccess');
        this.addEvent(this.script,'error', 'onLoadError');
        this.utils.isElement(this.wrapper) && this.wrapper.appendChild(this.script);
        return this.defer;
    },
    'show': function(methods){
        var method = methods.find(function(item){
            return item.supportedMethods === 'https://google.com/pay';
        });
        var client = this.getClient();
        return client.loadPaymentData(method.data);
    },
    'readyToPay': function(cx,response){
        if (response.result) {
            this.defer.resolveWith(this);
        }
    },
    'onError': function(cx,error){
        this.defer.rejectWith(this,error);
    },
    'onLoadSuccess': function(){
        this.getClient().isReadyToPay(config.GoogleBaseRequest)
            .then(this.proxy('readyToPay'))
            .catch(this.proxy('onError'));
    },
    'onLoadError': function(){
        this.defer.rejectWith(this);
    },
    'getClient': function(options){
        if (this.client === null) {
            var PaymentClient = this.utils.getPath('google.payments.api.PaymentsClient');
            if( PaymentClient ) {
                this.client = new PaymentClient(options);
            } else {
                this.onError(null, new Error('Google Client Error') );
            }
        }
        return this.client;
    }
});

module.exports = new GooglePay;