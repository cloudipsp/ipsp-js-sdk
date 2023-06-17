const {Module} = require('./module');

exports.Connector = Module.extend({
    ns: 'crossDomain',
    origin: '*',
    uniqueId: 1,
    signature: null,
    init(params) {
        this.setTarget(params.target);
        this.setOrigin(params.origin);
        this.create();
    },
    create() {
        this.addEvent(window, 'message', 'router');
    },
    setOrigin(origin){
        this.origin = origin || '*';
    },
    setTarget(target) {
        this.target = target;
        return this;
    },
    getUID() {
        return ++this.uniqueId;
    },
    destroy() {
        this.removeEvent(window, 'message', 'router');
        this._super();
    },
    router(window, ev, response) {
        if (this.target !== ev.source) return false;
        try {
            response = JSON.parse(ev.data);
        } catch (e) {
        }
        if (response && response.action && response.data) {
            this.trigger(response.action, response.data);
        }
    },
    send(action, data, request, options) {
        if(!this.target){
            return;
        }
        request = JSON.stringify({
            action: action,
            data: data
        });
        options = {
            targetOrigin: this.origin,
            delegate: 'payment'
        }
        try{
            this.target.postMessage(request,options);
        } catch(e) {
            this.target.postMessage(request,this.origin,[]);
        }
    }
});