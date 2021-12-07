var Utils = {
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
    'hasProp': function(o,v){
        return o && o.hasOwnProperty(v);
    },
    'forEach': function (ob, cb, cx) {
        var p;
        for (p in ob)
            if (this.hasProp(ob,p))
                cb.call(cx || null, ob[p], p);
    },
    'map': function (ob, cb, cx) {
        var p, t, r = [];
        for (p in ob)
            if (this.hasProp(ob,p))
                if ((t = cb.call(cx || null, ob[p], p)) !== undefined)
                    r[p] = t;
        return r;
    },
    'cleanObject': function (ob) {
        var p;
        for (p in ob) {
            if (this.hasProp(ob,p)) {
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
    'param': function (data) {
        var s = [];
        var add = function (k, v) {
            v = typeof v === 'function' ? v() : v;
            v = v === null ? '' : v === undefined ? '' : v;
            s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        };
        var ns = function(o,i){
            return (typeof o === 'object' && o ? i : '' )
        };
        var build = function (prefix, ob) {
            if (prefix) {
                if (Utils.isArray(ob)) {
                    Utils.forEach(ob,function(v,k){
                        build(prefix+'['+ns(v,k)+']',v);
                    })
                } else if (Utils.isObject(ob)) {
                    Utils.forEach(ob,function(v,k){
                        build(prefix+'['+k+']',v);
                    });
                } else {
                    add(prefix,ob);
                }
            } else if (Utils.isArray(ob)) {
                Utils.forEach(ob,function(v){
                    add(v.name,v.value);
                });
            } else {
                Utils.forEach(ob,function(v,k){
                    build(k,v);
                });
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
    },
    'uuid': function(){
        var a=0,b='';
        while(a++<36){
            if( a * 51 & 52 ){
                b+= ( a ^ 15 ? 8 ^ Math.random() * ( a ^ 20 ? 16 : 4 ) : 4 ).toString(16);
            } else {
                b+= '-';
            }
        }
        return b;
    },
    'getPath': function(path){
        var props = path.split('.');
        var first = props.shift();
        var value = null;
        if( this.hasProp(window,first) ) {
            value = window[first];
            this.forEach(props,function(name){
                value = this.hasProp(value,name) ? value[name] : null;
            },this)
        }
        return value;
    }
};

module.exports = Utils;
