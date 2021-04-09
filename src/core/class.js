var init = false;
var fnTest = /xyz/.test(function () {
    return 'xyz';
}.toString()) ? /\b_super\b/ : /.*/;
/**
 * @type {ClassObject}
 */
function ClassObject() {

}

ClassObject.prototype._super = function(){

}

ClassObject.prototype.instance = function(params){
    return new this.constructor(params);
}

ClassObject.prototype.proxy = function(fn){
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

ClassObject.extend = function extend(instance){
    function Class(){
        if (!init && this.init) this.init.apply(this, arguments);
    }
    Class.prototype = assign(this,instance);
    Class.prototype.constructor = Class;
    Class.extend = extend;
    return Class;
}

module.exports = ClassObject;
