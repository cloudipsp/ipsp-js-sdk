/**
 * @var $checkout = require('./dist/checkout')
 */

QUnit.module('checkout',{
    before:function(){
        this.checkout = $checkout('Api');
        this.checkout.setOrigin('https://api.dev.fondy.eu');
    },
    beforeEach:function(){
        this.params   = {
            merchant_id:'1396424',
            currency:'UAH',
            amount:0
        };
    }
});

QUnit.test('api.checkout.form.request:card', function( assert ) {
    var params = {};
    var done   = assert.async();
    QUnit.extend(params,this.params);
    QUnit.extend(params,{
        payment_system:'card',
        card_number: '4444555566661111',
        expiry_date: '12/30',
        cvv2: '111',
        email:'test@example.com'
    });
    this.checkout.scope(function(){
        this.request('api.checkout.form','request',params).done(function(){
            assert.ok(true,'success result');
            done();
        }).fail(function(model){
            assert.ok(model.attr('error.code'),'error code exist');
            assert.ok(model.attr('error.message'),'error message exist');
            done();
        });
    });
});



