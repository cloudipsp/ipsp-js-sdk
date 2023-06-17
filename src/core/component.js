/**
 * Modules registry
 * @type {Object<string,any>}
 */
const modules = {}
/**
 * @type {Object<string,any>}
 */
const instance = {}
/**
 * @param {string} name
 * @param {Object} [params]
 * @returns {{}}
 */
const newModule = function (name, params) {
    if (!modules[name]) {
        throw Error(['module is undefined', name].join(' '))
    }
    return new modules[name](params || {})
}

const addModule = function (name, module) {
    if (modules[name]) {
        throw Error(['module already added', name].join(' '))
    }
    modules[name] = module
}

function Component(name, params) {
    if (instance[name]) return instance[name]
    return (instance[name] = newModule(name, params))
}

Component.get = function (name, params) {
    return newModule(name, params)
}

Component.add = function (name, module) {
    addModule(name, module)
    return this
}

exports.Component = Component
