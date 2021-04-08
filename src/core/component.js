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
 * @return {*}
 */
Component.proxy = function (name) {
    return getModule(name).apply(this, [].slice.call(arguments, 1));
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
/**
 *
 * @param name
 * @param module
 * @return {Component}
 */
Component.scope = function (name, module) {
    addModule(name, module(this));
    return this;
};

module.exports = Component;