const {ClassObject} = require('./class');

exports.Event = ClassObject.extend({
    init() {
        this.events = {};
        this.empty = [];
    },
    on(type, callback) {
        (this.events[type] = this.events[type] || []).push(callback);
        return this;
    },
    off(type, callback) {
        type || (this.events = {});
        let list = this.events[type] || this.empty,
            i = list.length = callback ? list.length : 0;
        while (i--) callback === list[i][0] && list.splice(i, 1);
        return this;
    },
    trigger(type) {
        let e = this.events[type] || this.empty,
            list = e.length > 0 ? e.slice(0, e.length) : e,
            i = 0, j;
        while ((j = list[i++])) j.apply(j, this.empty.slice.call(arguments, 1));
        return this;
    }
});
