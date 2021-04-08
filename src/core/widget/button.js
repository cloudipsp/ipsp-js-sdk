var Widget = require('./index');
/**
 * @type {ClassObject}
 */
var Button = Widget.extend({
    'attributes': {},
    'initElement': function (el) {
        if (this.utils.isPlainObject(this.params.attributes)) {
            this.utils.extend(this.attributes, this.params.attributes);
        }
        this.addSelectorEvent(el, 'click', 'sendRequest');
    },
    'getRequestParams': function (el) {
        return this.utils.extend({}, this.params.options, this.getElementData(el));
    },
    'getElementData': function (el) {
        var result = {};
        this.utils.forEach(this.attributes, function (value, key) {
            if (el.hasAttribute(key)) {
                result[value] = el.getAttribute(key);
            }
        });
        return result;
    }
});

module.exports = Button;