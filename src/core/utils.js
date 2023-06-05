const Utils = {
    getType(o) {
        return ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },
    isObject(o) {
        return this.getType(o) === 'object';
    },
    isPlainObject(o) {
        return (!!o && typeof o === 'object' && o.constructor === Object);
    },
    isFunction(o) {
        return this.getType(o) === 'function';
    },
    isRegexp(o) {
        return this.getType(o) === 'regexp';
    },
    isArguments(o) {
        return this.getType(o) === 'arguments';
    },
    isError(o) {
        return this.getType(o) === 'error';
    },
    isArray(o) {
        return this.getType(o) === 'array';
    },
    isDate(o) {
        return this.getType(o) === 'date';
    },
    isString(o) {
        return this.getType(o) === 'string';
    },
    isNumber(o) {
        return this.getType(o) === 'number';
    },
    isElement(o) {
        return o && o.nodeType === 1;
    },
    toArray(o) {
        return [].slice.call(o);
    },
    querySelectorAll(o, p) {
        return this.toArray((p || document).querySelectorAll(o));
    },
    querySelector(o, p) {
        return (p || document).querySelector(o);
    },
    hasProp(o, v) {
        return o && o.hasOwnProperty(v);
    },
    forEach(ob, cb, cx) {
        for (let p in ob)
            if (this.hasProp(ob, p))
                cb.call(cx || null, ob[p], p);
    },
    map(ob, cb, cx) {
        let p, t, r = [];
        for (p in ob)
            if (this.hasProp(ob, p))
                if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                    r[p] = t;
        return r;
    },
    cleanObject(ob) {
        for (let p in ob) {
            if (this.hasProp(ob, p)) {
                if (ob[p].length === 0) {
                    if (this.isArray(ob)) ob.splice(p, 1);
                    if (this.isPlainObject(ob)) delete ob[p];
                } else if (this.isPlainObject(ob[p])) {
                    this.cleanObject(ob[p]);
                }
            }
        }
        return ob;
    },
    parseQuery(string, coerce, spaces) {
        let obj = {}, coerce_types = {'true': !0, 'false': !1, 'null': null};
        if (string === "" || string == null) return obj
        if (string.charAt(0) === "?") string = string.slice(1)
        if (spaces) string = string.replace(/\+/g,' ');
        string.split('&').forEach(function (v) {
            let param = v.split('=');
            let key = decodeURIComponent(param[0]);
            let cur = obj;
            let i = 0;
            let keys = key.split('][');
            let keys_last = keys.length - 1;
            if (/\[/.test(keys[0]) && /]$/.test(keys[keys_last])) {
                keys[keys_last] = keys[keys_last].replace(/]$/, '');
                keys = keys.shift().split('[').concat(keys);
                keys_last = keys.length - 1;
            } else {
                keys_last = 0;
            }
            if (param.length === 2) {
                let val = decodeURIComponent(param[1]);
                if (coerce) {
                    val = val && !isNaN(val) && ((+val + '') === val) ? +val
                        : val === 'undefined' ? undefined
                            : coerce_types[val] !== undefined ? coerce_types[val]
                                : val;
                }
                if (keys_last) {
                    for (; i <= keys_last; i++) {
                        key = keys[i] === '' ? cur.length : keys[i];
                        cur = cur[key] = i < keys_last
                            ? cur[key] || (keys[i + 1] && isNaN(keys[i + 1]) ? {} : [])
                            : val;
                    }
                } else {
                    if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
                        obj[key].push(val);
                    } else if ({}.hasOwnProperty.call(obj, key)) {
                        obj[key] = [obj[key], val];
                    } else {
                        obj[key] = val;
                    }
                }
            } else if (key) {
                obj[key] = coerce ? undefined : '';
            }
        });
        return obj;
    },
    buildQuery(data) {
        const s = [];
        const add = (k, v) => {
            v = typeof v === 'function' ? v() : v;
            v = v === null ? '' : v === undefined ? '' : v;
            s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        };
        const ns = function (o, i) {
            return (typeof o === 'object' && o ? i : '')
        };
        return (function build(prefix, ob) {
            if (prefix) {
                if (Utils.isArray(ob)) {
                    Utils.forEach(ob, function (v, k) {
                        build(prefix + '[' + ns(v, k) + ']', v);
                    })
                } else if (Utils.isObject(ob)) {
                    Utils.forEach(ob, function (v, k) {
                        build(prefix + '[' + k + ']', v);
                    });
                } else {
                    add(prefix, ob);
                }
            } else if (Utils.isArray(ob)) {
                Utils.forEach(ob, function (v) {
                    add(v.name, v.value);
                });
            } else {
                Utils.forEach(ob, function (v, k) {
                    build(k, v);
                });
            }
            return s;
        })('', data).join('&');
    },
    param(data) {
        return this.buildQuery(data)
    },
    removeElement(el) {
        el.parentNode.removeChild(el);
    },
    createElement(el) {
        return document.createElement(el);
    },
    getStyle(el, prop, getComputedStyle) {
        getComputedStyle = window.getComputedStyle;
        return (getComputedStyle ? getComputedStyle(el) : el['currentStyle'])[prop.replace(/-(\w)/gi, function (word, letter) {
            return letter.toUpperCase()
        })];
    },
    extend(obj) {
        this.forEach([].slice.call(arguments, 1), function (o) {
            if (o !== null) {
                this.forEach(o, function (value, key) {
                    if (this.isPlainObject(value)) {
                        obj[key] = this.extend(obj[key] || {}, value);
                    } else {
                        obj[key] = value;
                    }
                }, this);
            }
        }, this);
        return obj;
    },
    uuid() {
        let a = 0, b = '';
        while (a++ < 36) {
            if (a * 51 & 52) {
                b += (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16);
            } else {
                b += '-';
            }
        }
        return b;
    },
    getPath(path) {
        const props = path.split('.');
        const first = props.shift();
        let value = null;
        if (this.hasProp(window, first)) {
            value = window[first];
            this.forEach(props, function (name) {
                value = this.hasProp(value, name) ? value[name] : null;
            }, this)
        }
        return value;
    },
    stringFormat(format, params) {
        return (format || '').replace(/{(.+?)}/g, function (match, prop) {
            return params[prop] || match;
        });
    },
    cssUnit(value, unit) {
        return String(value || 0).concat(unit || '').concat(' !important')
    },
    hasPaymentRequest() {
        return window.hasOwnProperty('PaymentRequest') && typeof (window.PaymentRequest) === 'function'
    },
    getPaymentRequest(methods, details, options) {
        let request = null;
        options = options || {};
        details = details || {};
        details.id = this.uuid();
        if (this.hasPaymentRequest()) {
            try {
                request = new window.PaymentRequest(methods, details, options);
            } catch (e) {
                request = null;
            }
        }
        return request;
    }
};

module.exports = Utils;
