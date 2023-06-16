const digitTest = /^\d+$/;
const keyBreaker = /([^\[\]]+)|(\[\])/g;
const paramTest = /([^?#]*)(#.*)?$/;
const r20 = /%20/g;
const rbracket = /\[\]$/;
const matchSymbol = /\s([a-zA-Z]+)/

const prep = (str) => {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}
const flatten = (array) => {
    let result = []
    forEach(array, (item) => {
        result = result.concat(isArray(item) ? flatten(item) : item)
    })
    return result
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

const getType = exports.getType = (o) => {
    return ({}).toString.call(o).match(matchSymbol)[1].toLowerCase();
}
const isPlainObject = exports.isPlainObject = (o) => {
    return (!!o && typeof o === 'object' && o.constructor === Object);
}

const isFunction = exports.isFunction = (o) => {
    return getType(o) === 'function'
}

const isArray = exports.isArray = (o) => {
    return getType(o) === 'array';
}

const isElement = exports.isElement = (o) => {
    return o && o.nodeType === 1;
}

const toArray = exports.toArray = (o) => {
    return [].slice.call(o);
}

const hasProp = exports.hasProp = (o, v) => {
    return o && o.hasOwnProperty(v);
}

const forEach = exports.forEach = (ob, cb, cx) => {
    for (let p in ob)
        if (hasProp(ob, p))
            cb.call(cx || null, ob[p], p);
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

exports.isObject = (o) => {
    return getType(o) === 'object';
}

exports.isRegexp = (o) => {
    return getType(o) === 'regexp';
}

exports.isArguments = (o) => {
    return getType(o) === 'arguments';
}

exports.isError = (o) => {
    return getType(o) === 'error';
}

exports.isDate = (o) => {
    return getType(o) === 'date';
}

exports.isString = (o) => {
    return getType(o) === 'string';
}

exports.isNumber = (o) => {
    return getType(o) === 'number';
}

exports.map = (ob, cb, cx) => {
    let p, t, r = [];
    for (p in ob)
        if (hasProp(ob, p))
            if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                r[p] = t;
    return r;
}

exports.querySelectorAll = (o, p) => {
    return toArray((p || document).querySelectorAll(o))
}

exports.querySelector = (o, p) => {
    return (p || document).querySelector(o)
}


exports.deparam = (params) => {
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

exports.param = (obj) => {
    const result = [];
    forEach(obj, (item, prop) => {
        recursiveParams(prop, item, (key, value) => {
            value = value == null ? "" : value;
            result.push([encodeURIComponent(key), encodeURIComponent(value)].join('='));
        });
    });
    return result.join("&").replace(r20, '+');
}

exports.removeElement = (el) => {
    el.parentNode.removeChild(el);
}

exports.createElement = (tag) => {
    return document.createElement(tag);
}

exports.addClass = (...args) => {
    const el = args.shift()
    if (isElement(el) === false) return;
    const classList = el.className.trim().split(/\s+/)
    const tokens = flatten(args.map(item => item.trim().split(/\s+/)));
    tokens.forEach(token => {
        if (token && !~classList.indexOf(token)) {
            classList.push(token)
        }
    })
    el.className = classList.join(' ').trim()
}

exports.removeClass = (...args) => {
    const el = args.shift()
    if (isElement(el) === false) return;
    const classList = el.className.trim().split(/\s+/)
    const tokens = flatten(args.map(item => item.trim().split(/\s+/)));
    tokens.forEach((token) => {
        if (token) {
            const index = classList.indexOf(token)
            if (!!~index) {
                classList.splice(index, 1)
            }
        }
    })
    el.className = classList.join(' ').trim()
}

exports.removeAttr = (el, attrs) => {
    if (isElement(el) === false) return false;
    if (isPlainObject(attrs)) {
        forEach(attrs, (value, name) => {
            el.removeAttribute(name, value)
        })
    }
}

exports.addAttr = (el, attrs) => {
    if (isElement(el) === false) return false;
    if (isPlainObject(attrs)) {
        forEach(attrs, (value, name) => {
            el.setAttribute(name, value)
        })
    }
}


exports.getStyle = (el, prop, getComputedStyle) => {
    getComputedStyle = window.getComputedStyle;
    return (getComputedStyle ? getComputedStyle(el) : el['currentStyle'])[prop.replace(/-(\w)/gi, function (word, letter) {
        return letter.toUpperCase()
    })];
}


exports.getPath = (path) => {
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

exports.stringFormat = (format, params, expr) => {
    return (format || '').replace(expr || /{(.+?)}/g, (match, prop) => {
        return params[prop] || match;
    });
}

exports.cssUnit = (value, unit) => {
    return String(value || 0).concat(unit || '').concat(' !important')
}

exports.getPaymentRequest = ((cx) => {
    let NativePaymentRequest;
    if (hasProp(cx, 'PaymentRequest') && isFunction(cx.PaymentRequest)) {
        NativePaymentRequest = cx.PaymentRequest
    }
    return (methods, details, options) => {
        let request = null;
        details = details || {};
        details.id = uuid();
        options = options || {};
        if (NativePaymentRequest) {
            try {
                request = new NativePaymentRequest(methods, details, options);
            } catch (e) {
                request = null;
            }
        }
        return request
    }
})(window)

exports.jsonParse = (value, defaults) => {
    try {
        return JSON.parse(value)
    } catch (e) {
        return defaults
    }
}

