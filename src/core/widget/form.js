const {Module} = require('../module');
const {Widget} = require('./index');

const FormData = Module.extend({
    init(form) {
        this.setFormElement(form);
    },
    setFormElement(form) {
        if (this.utils.isElement(form)) {
            this.form = form;
        }
    },
    getData(filter) {
        const params = this.deparam(this.serializeArray());
        return filter === true ? this.utils.cleanObject(params) : params;
    },
    serializeArray() {
        const list = this.utils.toArray(this.form.elements);
        return this.utils.map(list, function (field) {
            if (field.disabled || field.name === '') return;
            if (field.type.match('checkbox|radio') && !field.checked) return;
            return {
                name: field.name,
                value: field.value
            };
        });
    },
    serializeAndEncode() {
        return this.utils.map(this.serializeArray(), function (field) {
            return [field.name, encodeURIComponent(field.value)].join('=');
        }).join('&');
    },
    deparam(obj) {
        let prop,result = {};
        const breaker = /[^\[\]]+|\[\]$/g;
        const attr = function (name, value) {
            let i, data = result, last = name.pop(), len = name.length;
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

exports.WidgetForm = Widget.extend({
    initElement(el) {
        this.addSelectorEvent(el, 'submit', 'sendRequest');
    },
    getRequestParams(el) {
        return this.utils.extend({}, this.params.options, new FormData(el).getData() );
    }
});


