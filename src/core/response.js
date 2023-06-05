const {Model} = require('./model');

const ProxyUrl = 'http://secure-redirect.cloudipsp.com/submit/';

exports.Response = Model.extend({
    stringFormat(string) {
        const that = this;
        return (string || '').replace(/{(.+?)}/g, function (match, prop) {
            return that.attr(['order.order_data', prop].join('.')) || match;
        });
    },
    setConnector(connector) {
        this.connector = connector;
        return this;
    },
    setUID(uid) {
        this.uid = uid;
        return this;
    },
    getUID() {
        return this.uid;
    },
    formDataProxy(url, data, target, method){
        location.assign([ProxyUrl, JSON.stringify({
            url: url,
            params: data,
            target: target,
            method: method
        })].join('#'));
    },
    formDataSubmit(url, data, target, method) {
        if( url.match(/^http:/) ){
            return this.formDataProxy(url,data,target,method);
        }
        const action = this.stringFormat(url);
        const form = this.prepareForm(action, data, target, method);
        const body = this.utils.querySelector('body');
        body.appendChild(form);
        form.submit();
        form.parentNode.removeChild(form);
    },
    inProgress() {
        return this.attr('order.in_progress');
    },
    readyToSubmit() {
        return this.attr('order.ready_to_submit');
    },
    waitForResponse() {
        return this.attr('order.pending');
    },
    needVerifyCode() {
        return this.attr('order.need_verify_code');
    },
    redirectUrl() {
        if (this.attr('url')) {
            this.redirectToUrl(this.attr('url'));
            return true;
        }
        return false;
    },
    redirectToUrl(url){
        location.assign(url);
    },
    submitToMerchant() {
        const ready = this.attr('order.ready_to_submit');
        const url = this.attr('model.url') || this.attr('order.response_url');
        const method = this.attr('order.method');
        const action = this.attr('order.action');
        const data = this.attr('model.send_data') || this.attr('order.order_data');
        if (ready && url && data) {
            if( action === 'redirect' || data['get_without_parameters'] === true) {
                this.redirectToUrl(url);
            } else {
                this.formDataSubmit(url, data, '_self', method);
            }
            return true;
        }
    },
    submitForm() {
        const method = this.attr('method');
        const url = this.attr('url');
        const data = this.attr('send_data');
        if (url && data) {
            this.formDataSubmit(url, data, '_self', method);
            return true;
        }
        return false;
    },
    sendResponse() {
        const action = this.attr('action');
        if (action === 'submit')
            return this.submitForm();
        if (action === 'redirect')
            return this.redirectUrl();
        return false;
    },
    prepare3dsData() {
        const params = {};
        const data = this.attr('submit3ds');
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
    waitOn3dsDecline() {
        const data = this.alt('submit3ds.checkout_data', {
            js_wait_on_3ds_decline: false,
            js_wait_on_3ds_decline_duration: 0
        });
        return data.js_wait_on_3ds_decline ? data.js_wait_on_3ds_decline_duration : 0;
    },
    submit3dsForm() {
        if (this.attr('submit3ds.checkout_data')) {
            this.connector.trigger('modal', this.prepare3dsData());
        }
    },
    supportedMethod(method){
        const item = this.find('methods',function(item){
            return item.alt('supportedMethods','').match(method)
        });
        if( item ){
            this.attr('methods',[item.serialize()])
        } else {
            this.attr('methods',[]);
        }
    }
});
