const {Component} = require('./core/component');
const {Api} = require('./core/api');
const {Module} = require('./core/module');
const {Connector} = require('./core/connector');
const {Response} = require('./core/response');
const {PaymentButton} = require('./core/payment/button');
const {PaymentRequest} = require('./core/payment/request');
const {PaymentElement} = require('./core/payment/element');
const {PaymentContainer} = require('./core/payment/container');
const {WidgetForm} = require('./core/widget/form');
const {WidgetButton} = require('./core/widget/button');
const Utils = require('./core/utils');
const Config = require('./core/config');

Component.add('Api', Api);
Component.add('Connector', Connector);
Component.add('PaymentContainer', PaymentContainer);
Component.add('PaymentRequest', PaymentRequest);
Component.add('PaymentElement', PaymentElement);
Component.add('PaymentButton', PaymentButton);
Component.add('FormWidget', WidgetForm);
Component.add('ButtonWidget', WidgetButton);
Component.add('Response', Response);

Component.Utils = Utils
Component.Config = Config

module.exports = Component;

exports.Api = Api;
exports.Module = Module;
exports.Utils = Utils;
exports.Config = Config;
exports.Connector = Connector;
exports.PaymentRequest = PaymentRequest;
exports.PaymentContainer = PaymentContainer;
exports.PaymentElement = PaymentElement;
exports.PaymentButton = PaymentButton;
exports.FormWidget = WidgetForm;
exports.WidgetButton = WidgetButton;
exports.Response = Response;