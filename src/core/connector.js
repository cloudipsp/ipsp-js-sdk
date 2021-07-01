var Module = require('./module');
/**
 * @type {ClassObject}
 */
var Connector = Module.extend({
    'ns': 'crossDomain',
    'origin': '*',
    'uniqueId': 1,
    'signature': null,
    'init': function (params) {
        this.setTarget(params.target);
        this.create();
    },
    'create': function () {
        this.addEvent(window, 'message', 'router');
    },
    'setTarget': function (target) {
        this.target = target;
        return this;
    },
    'getUID': function () {
        return ++this.uniqueId;
    },
    'destroy': function () {
        this.removeEvent(window, 'message', 'router');
        this._super();
    },
    'router': function (window, ev, response) {
        if (this.target !== ev.source) return false;
        try {
            response = JSON.parse(ev.data);
        } catch (e) {
        }
        if (response && response.action && response.data) {
            this.trigger(response.action, response.data);
        }
    },
    'send': function (action, data) {
        this.target.postMessage(JSON.stringify({
            action: action,
            data: data
        }), this.origin, []);
    }
});


module.exports = Connector;
