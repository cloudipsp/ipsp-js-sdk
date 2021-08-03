var Module = require('../module');
var Widget = require('./index');
/**
 * @type {ClassObject}
 */
var FormData = Module.extend({
    'init': function (form) {
        this.setFormElement(form);
    },
    'setFormElement': function (form) {
        if (this.utils.isElement(form)) {
            this.form = form;
        }
    },
    'getData': function (filter) {
        var params = this.deparam(this.serializeArray());
        return filter === true ? this.utils.cleanObject(params) : params;
    },
    'serializeArray': function () {
        var list = this.utils.toArray(this.form.elements);
        return this.utils.map(list, function (field) {
            if (field.disabled || field.name === '') return;
            if (field.type.match('checkbox|radio') && !field.checked) return;
            return {
                name: field.name,
                value: field.value
            };
        });
    },
    'serializeAndEncode': function () {
        return this.utils.map(this.serializeArray(), function (field) {
            return [field.name, encodeURIComponent(field.value)].join('=');
        }).join('&');
    },
    'deparam': function (obj) {
        var prop;
        var result = {};
        var breaker = /[^\[\]]+|\[\]$/g;
        var attr = function (name, value) {
            var i, data = result, last = name.pop(), len = name.length;
            for (i = 0; i < len; i++) {
                if (!data[name[i]])
                    data[name[i]] = len === i + 1 && last === '[]' ? [] : {};
                data = data[name[i]];
            }
            if (last === '[]') {
                data.push(value);
            } else {
                data[last] = value;
            }
        };
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                attr(obj[prop].name.match(breaker), obj[prop].value);
            }
        }
        return result;
    }
});
/**
 * @type {ClassObject}
 * @extends {Widget}
 */
var Form = Widget.extend({
    'initElement': function (el) {
        this.addSelectorEvent(el, 'submit', 'sendRequest');
    },
    'getRequestParams': function (el) {
        return this.utils.extend({}, this.params.options, new FormData(el).getData() );
    }
});

module.exports = Form;
