QUnit.module('checkout',{
    before:function(){
        this.checkout = $checkout('Api');
        this.checkout.setOrigin('https://api.dev.fondy.eu');
    },
    beforeEach:function(){
        this.params   = {
            merchant_id:'900204',
            currency:'UAH',
            amount:'200',
            payment_system:'p24'
        };
    }
});

QUnit.test('send form', function( assert ) {
    var done   = assert.async();
    var params = this.params;
    this.checkout.scope(function(){
        this.request('api.checkout.form','request',params).done(function(model){
            assert.ok(true,'success result');
            done();
        }).fail(function(model){
            assert.ok(true,'error result');
            done();
        });
    });
});