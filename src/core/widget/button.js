const { Widget } = require('./index')

exports.WidgetButton = Widget.extend({
    attributes: {},
    initElement(el) {
        if (this.utils.isPlainObject(this.params.attributes)) {
            this.utils.extend(this.attributes, this.params.attributes)
        }
        this.addSelectorEvent(el, 'click', 'sendRequest')
    },
    getRequestParams(el) {
        return this.utils.extend(
            {},
            this.params.options,
            this.getElementData(el)
        )
    },
    getElementData(el) {
        const result = {}
        this.utils.forEach(this.attributes, function (value, key) {
            if (el.hasAttribute(key)) {
                result[value] = el.getAttribute(key)
            }
        })
        return result
    },
})
