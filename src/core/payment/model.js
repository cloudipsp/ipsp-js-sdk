var Model = require('../model');
/**
 * @type {ClassObject}
 * @extends {Model}
 */
var PaymentModel = Model.extend({
    'create': function () {

    },
    'supportedMethod': function(method){
        var item = this.find('methods',function(item){
            return item.alt('supportedMethods','').match(method)
        }).serialize();
        this.attr('methods',[item])
    }

});

module.exports = PaymentModel;
