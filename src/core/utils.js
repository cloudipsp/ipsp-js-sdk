const digitTest = /^\d+$/;
const keyBreaker = /([^\[\]]+)|(\[\])/g;
const paramTest = /([^?#]*)(#.*)?$/;
const r20 = /%20/g;
const rbracket = /\[\]$/;

const matchSymbol = /\s([a-zA-Z]+)/

const getType = exports.getType = (o) => {
    return ({}).toString.call(o).match(matchSymbol)[1].toLowerCase();
}

const isObject = exports.getObject = (o) => {
    return getType(o) === 'object';
}

const isPlainObject = exports.isPlainObject = (o) => {
    return (!!o && typeof o === 'object' && o.constructor === Object);
}

const isFunction = exports.isFunction = (o) => {
    return getType(o) === 'function'
}

const isRegexp = exports.isRegexp = (o) => {
    return getType(o) === 'regexp';
}

const isArguments = exports.isArguments = (o) => {
    return getType(o) === 'arguments';
}

const isError = exports.isError = (o) => {
    return getType(o) === 'error';
}

const isArray = exports.isArray = (o) => {
    return getType(o) === 'array';
}

const isDate = exports.isDate = (o) => {
    return getType(o) === 'date';
}

const isString = exports.isString = (o) => {
    return getType(o) === 'string';
}

const isNumber = exports.isNumber = (o) => {
    return getType(o) === 'number';
}

const isElement = exports.isElement = (o) => {
    return o && o.nodeType === 1;
}

const toArray = exports.toArray = (o) => {
    return [].slice.call(o);
}

const querySelectorAll = exports.querySelectorAll = (o, p) => {
    return toArray((p || document).querySelectorAll(o))
}

const querySelector = exports.querySelector = (o, p) => {
    return (p || document).querySelector(o)
}

const hasProp = exports.hasProp = (o, v) => {
    return o && o.hasOwnProperty(v);
}

const forEach = exports.forEach = (ob, cb, cx) => {
    for (let p in ob)
        if (hasProp(ob, p))
            cb.call(cx || null, ob[p], p);
}

const map = exports.map = (ob, cb, cx) => {
    let p, t, r = [];
    for (p in ob)
        if (hasProp(ob, p))
            if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                r[p] = t;
    return r;
}

const cleanObject = exports.cleanObject = (ob) => {
    for (let p in ob) {
        if (hasProp(ob, p)) {
            if (ob[p].length === 0) {
                if (isArray(ob)) ob.splice(p, 1);
                if (isPlainObject(ob)) delete ob[p];
            } else if (isPlainObject(ob[p])) {
                cleanObject(ob[p]);
            }
        }
    }
    return ob;
}

const prep = (str) => {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}

const recursiveParams = (prefix, obj, next) => {
    if (isArray(obj)) {
        forEach(obj, (item, prop) => {
            if (rbracket.test(prefix)) {
                next(prefix, item);
            } else {
                recursiveParams(prefix + "[" + (isPlainObject(obj) ? prop : "") + "]", item, next);
            }
        });
    } else if (isPlainObject(obj)) {
        forEach(obj, (item, prop) => {
            recursiveParams(prefix + "[" + prop + "]", item, next);
        });
    } else {
        next(prefix, obj);
    }
}

const deparam = exports.deparam = (params) => {
    const data = {}
    if (params.charAt(0) === '?') params = params.slice(1)
    if (params && paramTest.test(params)) {
        forEach(params.split('&'), (pair) => {
            let parts = pair.split('='),
                key = prep(parts.shift()),
                value = prep(parts.join('=')),
                current = data;
            if (key) {
                parts = key.match(keyBreaker);
                for (let j = 0, l = parts.length - 1; j < l; j++) {
                    if (!current[parts[j]]) {
                        current[parts[j]] = digitTest.test(parts[j + 1]) || parts[j + 1] === '[]' ? [] : {};
                    }
                    current = current[parts[j]];
                }
                const lastPart = parts.pop();
                if (lastPart === '[]') {
                    current.push(value);
                } else {
                    current[lastPart] = value;
                }
            }
        });
    }
    return data;
}

const param = exports.param = (obj) => {
    const result = [];
    forEach(obj, (item, prop) => {
        recursiveParams(prop, item, (key, value) => {
            value = value == null ? "" : value;
            result.push([encodeURIComponent(key), encodeURIComponent(value)].join('='));
        });
    });
    return result.join("&").replace(r20, '+');
}

const removeElement = exports.removeElement = (el) => {
    el.parentNode.removeChild(el);
}

const createElement = exports.createElement = (el,attrs) => {
    const node = document.createElement(el);
    if(isPlainObject(attrs)) {
        forEach(attrs,(value,name)=>{
            node.setAttribute(name,value)
        })
    }
    return node;
}

const getStyle = exports.getStyle = (el, prop, getComputedStyle) => {
    getComputedStyle = window.getComputedStyle;
    return (getComputedStyle ? getComputedStyle(el) : el['currentStyle'])[prop.replace(/-(\w)/gi, function (word, letter) {
        return letter.toUpperCase()
    })];
}

const extend = exports.extend = (obj, ...args) => {
    forEach(args, function (o) {
        if (o !== null) {
            forEach(o, function (value, key) {
                if (isPlainObject(value)) {
                    obj[key] = extend(obj[key] || {}, value);
                } else {
                    obj[key] = value;
                }
            });
        }
    });
    return obj;
}

const uuid = exports.uuid = () => {
    let a = 0, b = '';
    while (a++ < 36) {
        if (a * 51 & 52) {
            b += (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16);
        } else {
            b += '-';
        }
    }
    return b;
}

const getPath = exports.getPath = (path) => {
    const props = path.split('.');
    const first = props.shift();
    let value = null;
    if (hasProp(window, first)) {
        value = window[first];
        forEach(props, (name) => {
            value = hasProp(value, name) ? value[name] : null;
        })
    }
    return value;
}

const stringFormat = exports.stringFormat = (format, params, expr) => {
    return (format || '').replace(expr || /{(.+?)}/g, (match, prop) => {
        return params[prop] || match;
    });
}

const cssUnit = exports.cssUnit = (value, unit) => {
    return String(value || 0).concat(unit || '').concat(' !important')
}

const hasPaymentRequest = exports.hasPaymentRequest = () => {
    return hasProp(window,'PaymentRequest') && isFunction(window.PaymentRequest)
}




const getPaymentRequest = exports.getPaymentRequest = (methods, details, options) => {
    let request = null;
    options = options || {};
    details = details || {};
    details.id = uuid();
    if (hasPaymentRequest()) {
        try {
            request = new window.PaymentRequest(methods, details, options);
        } catch (e) {
            request = null;
        }
    }
    return request;
}

const jsonParse = exports.jsonParse = (value, defaults) => {
    try {
        return JSON.parse(value)
    } catch (e) {
        return defaults
    }
}