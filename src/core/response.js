var Model = require('./model');
/**
 * @type {ClassObject}
 * @extends {Model}
 */

var ProxyUrl = 'http://secure-redirect.cloudipsp.com/submit/';


var Response = Model.extend({
    'stringFormat': function (string) {
        var that = this;
        return (string || '').replace(/{(.+?)}/g, function (match, prop) {
            return that.attr(['order.order_data', prop].join('.')) || match;
        });
    },
    'setConnector': function (connector) {
        this.connector = connector;
        return this;
    },
    'setUID': function (uid) {
        this.uid = uid;
        return this;
    },
    'getUID': function () {
        return this.uid;
    },
    'formDataProxy': function(url, data, target, method){
        location.assign([ProxyUrl, JSON.stringify({
            url: url,
            params: data,
            target: target,
            method: method
        })].join('#'));
    },
    'formDataSubmit': function (url, data, target, method) {
        if( url.match(/^http:/) ){
            return this.formDataProxy(url,data,target,method);
        }
        var action = this.stringFormat(url);
        var form = this.prepareForm(action, data, target, method);
        var body = this.utils.querySelector('body');
        body.appendChild(form);
        form.submit();
        form.parentNode.removeChild(form);
    },
    'inProgress': function () {
        return this.attr('order.in_progress');
    },
    'readyToSubmit': function () {
        return this.attr('order.ready_to_submit');
    },
    'waitForResponse': function () {
        return this.attr('order.pending');
    },
    'needVerifyCode': function () {
        return this.attr('order.need_verify_code');
    },
    'redirectUrl': function () {
        if (this.attr('url')) {
            location.assign(this.attr('url'));
            return true;
        }
        return false;
    },
    'submitToMerchant': function () {
        var ready = this.attr('order.ready_to_submit');
        var url = this.attr('model.url') || this.attr('order.response_url');
        var method = this.attr('order.method');
        var data = this.attr('model.send_data') || this.attr('order.order_data');
        if (ready && url && data) {
            this.formDataSubmit(url, data, '_self', method);
            return true;
        }
    },
    'submitForm': function () {
        var method = this.attr('method');
        var url = this.attr('url');
        var data = this.attr('send_data');
        if (url && data) {
            this.formDataSubmit(url, data, '_self', method);
            return true;
        }
        return false;
    },
    'sendResponse': function () {
        var action = this.attr('action');
        if (action === 'submit')
            return this.submitForm();
        if (action === 'redirect')
            return this.redirectUrl();
        return false;
    },
    'prepare3dsData': function () {
        var params = {};
        var data = this.attr('submit3ds');
        if (data['3ds']) {
            params.token = this.attr('token');
            params.uid = this.getUID();
            params.frame = true;
            if (data['send_data'].TermUrl) {
                data['send_data'].TermUrl = [
                    data['send_data'].TermUrl,
                    this.utils.param(params)
                ].join('#!!');
            }
        }
        return data;
    },
    'waitOn3dsDecline': function () {
        var data = this.alt('submit3ds.checkout_data', {
            js_wait_on_3ds_decline: false,
            js_wait_on_3ds_decline_duration: 0
        });
        return data.js_wait_on_3ds_decline ? data.js_wait_on_3ds_decline_duration : 0;
    },
    'submit3dsForm': function () {
        if (this.attr('submit3ds.checkout_data')) {
            this.connector.trigger('modal', this.prepare3dsData());
        }
    },
    'supportedMethod': function(method){
        var item = this.find('methods',function(item){
            return item.alt('supportedMethods','').match(method)
        });
        if( item ){
            this.attr('methods',[item.serialize()])
        } else {
            this.attr('methods',[]);
        }
    }
});

module.exports = Response;
