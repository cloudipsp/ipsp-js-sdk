var Module = require('./module');

var Model = Module.extend({
    'init': function (data) {
        this.data = data || {};
        this.create();
    },
    'create': function () {

    },
    'each': function () {
        var args = arguments;
        var name = args[1] ? args[0] : null;
        var callback = args[1] ? args[1] : args[0];
        var prop, value = name ? this.alt(name, []) : this.data;
        for (prop in value) {
            if (value.hasOwnProperty(prop)) {
                callback(this.instance(value[prop]), value[prop], prop);
            }
        }
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