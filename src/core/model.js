const {Module} = require('./module');

exports.Model = Module.extend({
    init(data) {
        this.data = data || {};
        this.create();
    },
    create() {

    },
    eachProps(args){
        const name = args[1] ? args[0] : null;
        const callback = args[1] ? args[1] : args[0];
        const list = name ? this.alt(name, []) : this.data;
        return {
            list: list,
            callback: callback
        }
    },
    each() {
        const props = this.eachProps(arguments);
        for (let prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                props.callback(this.instance(props.list[prop]), props.list[prop], prop)
            }
        }
    },
    filter(){
        const props = this.eachProps(arguments);
        for (let prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                const item   = this.instance(props.list[prop]);
                if( props.callback(item, props.list[prop], prop) ){
                    return props.list[prop];
                }
            }
        }
    },
    find(){
        const props = this.eachProps(arguments);
        for (let prop in props.list) {
            if (props.list.hasOwnProperty(prop)) {
                const item   = this.instance(props.list[prop]);
                if( props.callback(item, props.list[prop], prop) ){
                    return item;
                }
            }
        }
        return false;
    },
    alt(prop, defaults) {
        prop = this.attr(prop);
        return typeof (prop) === 'undefined' ? defaults : prop;
    },
    attr(key, value) {
        let i = 0,
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
    stringify() {
        return JSON.stringify(this.serialize());
    },
    serialize() {
        return this.data;
    }
});
