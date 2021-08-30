var Deferred  = require('../deferred');
var Module  = require('../module');
var Api     = require('../api');
var METHODS = [
    ['google',{
        supportedMethods: ['https://google.com/pay'],
        data: {
            'apiVersion': 2,
            'apiVersionMinor': 0,
            'allowedPaymentMethods': [
                {
                    'type': 'CARD',
                    'parameters': {
                        "allowedAuthMethods": ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        "allowedCardNetworks": ['MASTERCARD', 'VISA','AMEX', 'DISCOVER', 'INTERAC', 'JCB']
                    }
                }
            ]
        }
    }],
    ['apple',{'supportedMethods': ['https://apple.com/apple-pay']}],
    ['card',{'supportedMethods': ['basic-card']}]
];
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Request = Module.extend({
    'config': {
        payment_system: '',
        methods: [],
        details: {},
        options: {}
    },
    'init': function (params) {
        this.params = params || {};
    },
    'setConfig': function (config) {
        this.config = config;
        return this;
    },
    'setMerchant':function(merchant){
        this.merchant = merchant;
    },
    'setApi': function (api) {
        if (api instanceof Api) {
            this.api = api;
        }
    },
    'getSupportedMethod': function () {
        var details = {total: {label: 'Total', amount: {currency: 'USD', value: '0.00'}}};
        (function(module,list, index){
            var request,method,config;
            var callback = arguments.callee;
            var item     = list[index] || false;
            if( item === false ) {
                return item;
            }
            index  = (index || 0 ) + 1;
            method = item[0];
            config = item[1];
            try {
                request = new PaymentRequest([config], details);
                request.canMakePayment().then(function (status) {
                    if( status ){
                        module.trigger('supported',method);
                    } else {
                        callback(module,list,index);
                    }
                });
            } catch (e) {
                callback(module,list,index);
            }
        })(this,METHODS,0);
    },
    'modelRequest': function (method, params, callback, failure) {
        if (this.api instanceof Api) {
            this.api.scope(this.proxy(function(){
                this.api.request('api.checkout.pay', method, params)
                    .done(this.proxy(callback)).fail(this.proxy(failure));
            }));
        }
    },
    'getOrderId': function(){
        var list = ['order'];
        list.push(String(Math.round(Math.random() * 1e5)));
        list.push(String(Math.round(Math.random() * 1e5)));
        list.push(String(Math.round(Math.random() * 1e5)));
        return list.join('-');
    },
    'getRequest': function () {
        var request = null, module  = this, defer = Deferred() , params = this.params;
        try {
            this.config.details.id = this.getOrderId();
            request = new PaymentRequest(this.config.methods,this.config.details,this.config.options);
            this.addEvent(request, 'merchantvalidation', 'merchantValidation');
            request.canMakePayment().then(function(status){
                request.show().then(function(response){
                    response.complete('success').then(function(result){
                        defer.resolveWith(module,[response,result])
                    });
                }).catch(function(e){
                    defer.rejectWith(module,[{code:e.code,message:e.message},request]);
                })
            }).catch(function(e){
                defer.rejectWith(module,[{code:e.code,message:e.message},request]);
            });
        } catch (e) {
            defer.rejectWith(module,[{code:e.code,message:e.message},request]);
        }
        return defer;
    },
    'pay': function () {
        this.getRequest().done(function(response){
            this.trigger('complete',{
                payment_system: this.config.payment_system,
                data: response.details
            });
        }).fail(function(error){
            this.trigger('error',error);
            if( this.params.embedded === true ){
                location.reload();
                this.trigger('reload',this.params);
            }
        });
    },
    'appleSession': function (params) {
        var defer = Deferred();
        this.modelRequest('session', params, function (c, model) {
            defer.resolveWith(this,[model.serialize()]);
        }, function(c,model) {
            defer.rejectWith(this,[model]);
        });
        return defer;
    },
    'merchantValidation': function (cx, event) {
        this.appleSession({
            url: event['validationURL'] ,
            domain: location['host'] ,
            merchant_id: this.merchant
        }).done(function(session){
            try {
                event.complete(session.data);
            } catch (error) {
                this.trigger('error',error);
            }
        }).fail(function(error){
            this.trigger('error',error);
        });
    }
});

module.exports = Request;
