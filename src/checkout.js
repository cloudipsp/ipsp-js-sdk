const {Component} = require('./core/component');
const Utils = require('./core/utils');
const Config = require('./core/config');
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

Component.add('Api', Api);
Component.add('Connector', Connector);
Component.add('PaymentButton', PaymentButton);
Component.add('PaymentRequest', PaymentRequest);
Component.add('PaymentElement', PaymentElement);
Component.add('FormWidget', WidgetForm);
Component.add('ButtonWidget', WidgetButton);

Component.Utils = exports.Utils = Utils
Component.Config = exports.Config = Config
Component.Api = exports.Api = Api;
Component.Module = exports.Module = Module;
Component.Connector = exports.Connector = Connector;
Component.PaymentRequest = exports.PaymentRequest = PaymentRequest;
Component.PaymentContainer = exports.PaymentContainer = PaymentContainer;
Component.PaymentElement = exports.PaymentElement = PaymentElement;
Component.PaymentButton = exports.PaymentButton = PaymentButton;
Component.Response = exports.Response = Response;

module.exports = Component;