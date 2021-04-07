var Class = require('./class');

var Utils = Class.extend({
    'getType': function (o) {
        return ({}).toString.call(o).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },
    'isObject': function (o) {
        return this.getType(o) === 'object';
    },
    'isPlainObject': function (o) {
        return (!!o && typeof o === 'object' && o.constructor === Object);
    },
    'isFunction': function (o) {
        return this.getType(o) === 'function';
    },
    'isRegexp': function (o) {
        return this.getType(o) === 'regexp';
    },
    'isArguments': function (o) {
        return this.getType(o) === 'arguments';
    },
    'isError': function (o) {
        return this.getType(o) === 'error';
    },
    'isArray': function (o) {
        return this.getType(o) === 'array';
    },
    'isDate': function (o) {
        return this.getType(o) === 'date';
    },
    'isString': function (o) {
        return this.getType(o) === 'string';
    },
    'isNumber': function (o) {
        return this.getType(o) === 'number';
    },
    'isElement': function (o) {
        return o && o.nodeType === 1;
    },
    'toArray': function (o) {
        return [].slice.call(o);
    },
    'querySelectorAll': function (o, p) {
        return this.toArray((p || document).querySelectorAll(o));
    },
    'querySelector': function (o, p) {
        return (p || document).querySelector(o);
    },
    'forEach': function (ob, cb, cx) {
        var p;
        for (p in ob)
            if (ob.hasOwnProperty(p))
                cb.call(cx || null, ob[p], p);
    },
    'map': function (ob, cb, cx) {
        var p, t, r = [];
        for (p in ob)
            if (ob.hasOwnProperty(p))
                if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                    r[p] = t;
        return r;
    },
    'cleanObject': function (object) {
        var prop;
        for (prop in object) {
            if (object.hasOwnProperty(prop)) {
                if (object[prop].length === 0) {
                    if (this.isArray(object)) object.splice(prop, 1);
                    if (this.isPlainObject(object)) delete object[prop];
                } else if (this.isPlainObject(object[prop])) {
                    this.cleanObject(object[prop]);
                }
            }
        }
        return object;
    },
    'param': function (data) {
        var s = [];
        var add = function (k, v) {
            v = typeof v === 'function' ? v() : v;
            v = v === null ? '' : v === undefined ? '' : v;
            s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        };
        var build = function (prefix, obj) {
            var i, len, key;
            if (prefix) {
                if (Array.isArray(obj)) {
                    for (i = 0, len = obj.length; i < len; i++) {
                        build(
                            prefix + '[' + (typeof obj[i] === 'object' && obj[i] ? i : '') + ']',
                            obj[i]
                        );
                    }
                } else if (String(obj) === '[object Object]') {
                    for (key in obj) {
                        if (obj.hasOwnProperty(key))
                            build(prefix + '[' + key + ']', obj[key]);
                    }
                } else {
                    add(prefix, obj);
                }
            } else if (Array.isArray(obj)) {
                for (i = 0, len = obj.length; i < len; i++) {
                    add(obj[i].name, obj[i].value);
                }
            } else {
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        build(key, obj[key]);
                    }
                }
            }
            return s;
        };
        return build('', data).join('&');
    },
    'removeElement': function (el) {
        el.parentNode.removeChild(el);
    },
    'createElement': function (el) {
        return document.createElement(el);
    },
    'getStyle': function (el, prop, getComputedStyle) {
        getComputedStyle = window.getComputedStyle;
        return (getComputedStyle ? getComputedStyle(el) : el['currentStyle'])[prop.replace(/-(\w)/gi, function (word, letter) {
            return letter.toUpperCase()
        })];
    },
    'extend': function (obj) {
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
    }
}, 'Utils');


module.exports = Utils;