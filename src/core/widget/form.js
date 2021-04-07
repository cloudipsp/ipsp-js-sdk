var Widget = require('./index');

var Form = Widget.extend({
    'initElement': function (el) {
        this.addSelectorEvent(el, 'submit', 'sendRequest');
    },
    'getRequestParams': function (el) {
        return this.utils.extend({}, this.params.options, ns.get('FormData', el).getData());
    }
});

module.exports = Form;