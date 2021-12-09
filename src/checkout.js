var Component = require('./core/component');

var Api = require('./core/api');
var Module = require('./core/module');
var Connector = require('./core/connector');
var Response = require('./core/response');
var PaymentButton = require('./core/payment/button');
var PaymentContainer = require('./core/payment/container');
var FormWidget = require('./core/widget/form');
var ButtonWidget = require('./core/widget/button');
var Utils = require('./core/utils');
var Config = require('./core/config');

Component.add('Api', Api);
Component.add('Connector', Connector);
Component.add('PaymentContainer', PaymentContainer);
Component.add('PaymentButton', PaymentButton);
Component.add('FormWidget', FormWidget);
Component.add('ButtonWidget', ButtonWidget);
Component.add('Response', Response);

module.exports = Component;
module.exports['Api'] = Api;
module.exports['Module'] = Module;
module.exports['Utils'] = Utils;
module.exports['Config'] = Config;
module.exports['Connector'] = Connector;
module.exports['PaymentContainer'] = PaymentContainer;
module.exports['PaymentButton'] = PaymentButton;
module.exports['FormWidget'] = FormWidget;
module.exports['ButtonWidget'] = ButtonWidget;
module.exports['Response'] = Response;
