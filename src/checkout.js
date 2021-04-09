var Api = require('./core/api');
var Connector = require('./core/connector');
var PaymentButton = require('./core/payment/button');
var PaymentContainer = require('./core/payment/container');
var FormWidget = require('./core/widget/form');
var ButtonWidget = require('./core/widget/button');

var modules = {};
var instance = {};

var newModule = function (name, params) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '));
    }
    return new modules[name](params || {});
};

var addModule = function (name, module) {
    if (modules[name]) {
        throw Error(['module already added', name].join(' '));
    }
    modules[name] = module;
};

function Component(name, params){
    if (instance[name]) return instance[name];
    return (instance[name] = newModule(name, params));
}

Component.get = function (name, params) {
    return newModule(name, params);
};

Component.add = function (name, module) {
    addModule(name, module);
    return this;
};

Component.add('Api', Api);
Component.add('Connector', Connector);
Component.add('PaymentContainer', PaymentContainer);
Component.add('PaymentButton', PaymentButton);
Component.add('FormWidget', FormWidget);
Component.add('ButtonWidget', ButtonWidget);

module.exports = Component;
module.exports['Api'] = Api;
module.exports['Connector'] = Connector;
module.exports['PaymentContainer'] = PaymentContainer;
module.exports['PaymentButton'] = PaymentButton;
module.exports['FormWidget'] = FormWidget;
module.exports['ButtonWidget'] = ButtonWidget;