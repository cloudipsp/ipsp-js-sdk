var init = false;

var fnTest = /xyz/.test(function () {
    return 'xyz';
}.toString()) ? /\b_super\b/ : /.*/;

var Class = function () {

};

Class.prototype._super = function(){

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

function superMethod(parent,name,method){
    return function () {
        var temp = this._super, result;
        this._super = parent[name];
        result = method.apply(this,arguments);
        this._super = temp;
        return result;
    };
}

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
 * @name extendMethod
 * @method
 * @param {object} instance
 * @return {ClassConstructor}
 */
function extend(instance){
    /**
     * @name ClassConstructor
     */
    function Class(){
        if (!init && this.init) this.init.apply(this, arguments);
    }
    Class.prototype = assign(this,instance);
    Class.prototype.constructor = Class;
    /**
     * @method
     * @inner
     */
    Class.extend = extend;
    return Class;
}


module.exports = Class;

module.exports['extend'] = extend;

