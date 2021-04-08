var Api = require('./core/api');
var Connector = require('./core/connector');
var PaymentButton = require('./core/payment/button');
var PaymentContainer = require('./core/payment/container');
var FormWidget = require('./core/widget/form');
var ButtonWidget = require('./core/widget/button');

/**
 *
 * @type {{}}
 */
var modules = {};
/**
 *
 * @type {{}}
 */
var instance = {};
/**
 *
 * @param name
 * @return {*}
 */
var getModule = function (name) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '));
    }
    return modules[name];
};
/**
 *
 * @param name
 * @param params
 * @return {*}
 */
var newModule = function (name, params) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '));
    }
    return new modules[name](params || {});
};
/**
 *
 * @param name
 * @param module
 */
var addModule = function (name, module) {
    if (modules[name]) {
        throw Error(['module already added', name].join(' '));
    }
    modules[name] = module;
};
/**
 *
 * @param name
 * @param params
 * @return {*}
 * @constructor
 */
var Component = function(name, params){
    if (instance[name]) return instance[name];
    return (instance[name] = newModule(name, params));
}
/**
 *
 * @param name
 * @param params
 * @return {*}
 */
Component.get = function (name, params) {
    return newModule(name, params);
};
/**
 *
 * @param name
 * @return {*}
 */
Component.module = function (name) {
    return getModule(name);
};
/**
 *
 * @param name
 * @param module
 * @return {Component}
 */
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