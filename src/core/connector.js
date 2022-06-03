var Module = require('./module');
/**
 * @type {ClassObject}
 * @extends {Module}
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
            if( response.action === 'pay' ) {
                console.log(JSON.stringify(ev))
            }
            this.trigger(response.action, response.data);
        }
    },
    'send': function (action, data, request, options) {
        if(!this.target){
            return;
        }
        request = JSON.stringify({
            action: action,
            data: data
        });
        options = {
            targetOrigin: this.origin,
            delegate: 'payment',
            transfer: []
        }
        try{
            this.target.postMessage(request,options,[]);
        } catch(e) {
            this.target.postMessage(request,this.origin,[]);
        }
    }
});


module.exports = Connector;
