var Module = require('./module');
/**
 * @type {ClassObject}
 * @extends {Module}
 */
var Model = Module.extend({
    'init': function (data) {
        this.data = data || {};
        this.create();
    },
    'create': function () {

    },
    'eachProps': function(args){
        var name = args[1] ? args[0] : null;
        var callback = args[1] ? args[1] : args[0];
        var list = name ? this.alt(name, []) : this.data;
        return {
            list: list,
            callback: callback
        }
    },
    'each': function () {
        var prop;
        var props = this.eachProps(arguments);
        for (prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                props.callback(this.instance(props.list[prop]), props.list[prop], prop)
            }
        }
    },
    'filter': function(){
        var item,prop;
        var props = this.eachProps(arguments);
        for (prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                item   = this.instance(props.list[prop]);
                if( props.callback(item, props.list[prop], prop) ){
                    return props.list[prop];
                }
            }
        }
    },
    /**
     *
     * @return {boolean|Model}
     */
    'find': function(){
        var item,prop;
        var props = this.eachProps(arguments);
        for (prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                item   = this.instance(props.list[prop]);
                if( props.callback(item, props.list[prop], prop) ){
                    return item;
                }
            }
        }
        return false;
    },
    'alt': function (prop, defaults) {
        prop = this.attr(prop);
        return typeof (prop) === 'undefined' ? defaults : prop;
    },
    'attr': function (key, value) {
        var i = 0,
            data = this.data,
            name = (key || '').split('.'),
            prop = name.pop(),
            len = arguments.length;
        for (; i < name.length; i++) {
            if (data && data.hasOwnProperty(name[i])) {
                data = data[name[i]];
            } else {
                if (len === 2) {
                    data = (data[name[i]] = {});
                } else {
                    break;
                }
            }
        }
        if (len === 1) {
            return data ? data[prop] : undefined;
        }
        if (len === 2) {
            data[prop] = value;
        }
        return this;
    },
    'stringify': function () {
        return JSON.stringify(this.serialize());
    },
    'serialize': function () {
        return this.data;
    }
});


module.exports = Model;
