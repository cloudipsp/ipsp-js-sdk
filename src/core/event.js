var Class = require('./class');
/**
 * @type ClassObject
 */
var Event = Class.extend({
    'init': function () {
        this.events = {};
        this.empty = [];
    },
    'on': function (type, callback) {
        (this.events[type] = this.events[type] || []).push(callback);
        return this;
    },
    'off': function (type, callback) {
        type || (this.events = {});
        var list = this.events[type] || this.empty,
            i = list.length = callback ? list.length : 0;
        while (i--) callback === list[i][0] && list.splice(i, 1);
        return this;
    },
    'trigger': function (type) {
        var e = this.events[type] || this.empty,
            list = e.length > 0 ? e.slice(0, e.length) : e,
            i = 0, j;
        while ((j = list[i++])) j.apply(j, this.empty.slice.call(arguments, 1));
        return this;
    }
});

module.exports = Event;