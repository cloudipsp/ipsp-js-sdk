var init = false;

var fnTest = /xyz/.test(function () {
    return 'xyz';
}.toString()) ? /\b_super\b/ : /.*/;

var Class = function () {

};

Class.prototype.instance = function(params){
    return new this.constructor(params);
}

Class.prototype.proxy = function(fn){
    fn = typeof (fn) == 'string' ? this[fn] : fn;
    return (function (cx, cb) {
        return function () {
            return cb.apply(cx, [this].concat(Array.prototype.slice.call(arguments)))
        };
    })(this, fn);
}
/**
 *
 * @param parent
 * @param name
 * @param method
 * @return {function(): *}
 */
function superMethod(parent,name,method){
    return function () {
        var temp = this._super, result;
        this._super = parent[name];
        result = method.apply(this,arguments);
        this._super = temp;
        return result;
    };
}
/**
 *
 * @param {Component|Function} target
 * @param {object} instance
 * @return {object}
 */
function assign(target,instance){
    var prop,proto,parent = target.prototype;
    init = true;
    proto = new target();
    init = false;
    for (prop in instance) {
        if (instance.hasOwnProperty(prop)) {
            if (typeof (parent[prop]) == 'function' &&
                typeof (instance[prop]) == 'function' &&
                fnTest.test(instance[prop])
            ) {
                proto[prop] = superMethod(parent,prop,instance[prop]);
            } else {
                proto[prop] = instance[prop];
            }
        }
    }
    return proto;
}

/**
 *
 * @param instance
 * @return {Component}
 */
Class.extend = function (instance) {
    function Component(){
        if (!init && this.init) this.init.apply(this, arguments);
    }
    Component.prototype = assign(this,instance);
    Component.prototype.constructor = Component;
    Component.extend = Class.extend;
    return Component;
};
/**
 *
 * @param {Component} parent
 * @param {object} instance
 * @return {Component}
 */
Class.createClass = function(parent,instance){
    function Component(){
        if (!init && this.init) this.init.apply(this, arguments);
    }
    Component.prototype = assign(parent,instance);
    Component.prototype.constructor = Component;
    Component.extend = arguments.callee;
    return Component;
}


module.exports = Class;

