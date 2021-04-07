var Component = require('./core');
var Api = require('./core/api');
var PaymentButton = require('./core/payment/button');
var PaymentContainer = require('./core/payment/container');
var FormWidget = require('./core/widget/form');
var ButtonWidget = require('./core/widget/button');


Component.add('Api', Api);
Component.add('PaymentContainer', PaymentContainer);
Component.add('PaymentButton', PaymentButton);
Component.add('FormWidget', FormWidget);
Component.add('ButtonWidget', ButtonWidget);

module.exports = Component;
