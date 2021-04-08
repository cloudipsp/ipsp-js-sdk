var Class = require('./class');
var Event = require('./event');
var Utils = require('./utils');
/**
 * @type {ClassObject}
 */
var Module =  Class.extend({
    'utils': Utils,
    'getListener': function () {
        if (!this._listener_) this._listener_ = new Event();
        return this._listener_;
    },
    'destroy': function () {
        this.off();
    },
    'on': function (type, callback) {
        this.getListener().on(type, callback);
        return this;
    },
    'off': function (type, callback) {
        this.getListener().off(type, callback);
        return this;
    },
    'proxy': function (fn) {
        if (!this._proxy_cache_) this._proxy_cache_ = {};
        if (this.utils.isString(fn)) {
            if (!this._proxy_cache_[fn]) {
                this._proxy_cache_[fn] = this._super(fn);
            }
            return this._proxy_cache_[fn];
        }
        return this._super(fn);
    },
    'trigger': function () {
        this.getListener().trigger.apply(this.getListener(), arguments);
        return this;
    },
    'each': function (ob, cb) {
        this.utils.forEach(ob, this.proxy(cb));
    },
    'addAttr': function (el, ob) {
        if (!this.utils.isElement(el)) return false;
        this.utils.forEach(ob, function (v, k) {
            el.setAttribute(k, v);
        });
    },
    'addCss': function (el, ob) {
        if (!this.utils.isElement(el)) return false;
        this.utils.forEach(ob, function (v, k) {
            this.addCssProperty(el, k, v);
        }, this);
    },
    'addCssProperty': function (el, style, value) {
        var result = el.style.cssText.match(new RegExp("(?:[;\\s]|^)(" +
            style.replace("-", "\\-") + "\\s*:(.*?)(;|$))")),
            idx;
        if (result) {
            idx = result.index + result[0].indexOf(result[1]);
            el.style.cssText = el.style.cssText.substring(0, idx) +
                style + ": " + value + ";" +
                el.style.cssText.substring(idx + result[1].length);
        } else {
            el.style.cssText += " " + style + ": " + value + ";";
        }
    },
    'addEvent': function (el, ev, cb) {
        if (!el || !ev || !cb) return false;
        cb = this.proxy(cb);
        if (el.addEventListener) el.addEventListener(ev, cb);
        else if (el['attachEvent']) el['attachEvent']('on' + ev, cb);
    },
    'removeEvent': function (el, ev, cb) {
        if (!el || !ev || !cb) return false;
        cb = this.proxy(cb);
        if (el.removeEventListener) el.removeEventListener(ev, cb, false);
        else if (el['detachEvent']) el['detachEvent']('on' + ev, cb);
    },
    'prepareForm': function (url, data, target, method) {
        var form = this.utils.createElement('form');
        this.addAttr(form, {
            'action': url,
            'target': target || '_self',
            'method': method || 'POST'
        });
        this.addCss(form, {
            'display': 'none'
        });
        this.utils.forEach(data, function (v, k, el) {
            el = this.utils.createElement('input');
            el.type = 'hidden';
            el.name = k;
            el.value = v;
            form.appendChild(el);
        }, this);
        return form;
    }
});

module.exports = Module;