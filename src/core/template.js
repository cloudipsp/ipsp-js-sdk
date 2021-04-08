var Views = require('./views');
var Utils = require('./utils');

var settings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
};
var noMatch = /(.)^/;
var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};
var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
var htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
};
var entityRe = new RegExp('[&<>"\']', 'g');
var escapeExpr = function (string) {
    if (string == null) return '';
    return ('' + string).replace(entityRe, function (match) {
        return htmlEntities[match];
    });
};
var counter = 0;
var template = function (text) {
    var render;
    var matcher = new RegExp([
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, function (match) {
            return '\\' + escapes[match];
        });
        if (escape) {
            source += "'+\n((__t=(" + escape + "))==null?'':escapeExpr(__t))+\n'";
        }
        if (interpolate) {
            source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        }
        if (evaluate) {
            source += "';\n" + evaluate + "\n__p+='";
        }
        index = offset + match.length;
        return match;
    });
    source += "';\n";
    if (!settings['variable']) source = 'with(obj||{}){\n' + source + '}\n';
    source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + "return __p;\n//# sourceURL=/tmpl/source[" + counter++ + "]";
    try {
        render = new Function(settings['variable'] || 'obj', 'escapeExpr', source);
    } catch (e) {
        e.source = source;
        throw e;
    }
    var template = function (data) {
        return render.call(this, data, escapeExpr);
    };
    template.source = 'function(' + (settings['variable'] || 'obj') + '){\n' + source + '}';
    return template;
};

var Template = Utils.extend({
    'init': function (name) {
        this.name = name;
        this.view = {};
        this.output();
    },
    'output': function () {
        this.view.source = Views[this.name];
        this.view.output = template(this.view.source);
    },
    'render': function (data) {
        this.data = data;
        return this.view.output.call(this, this);
    },
    'include': function (name, data) {
        return this.instance(name).render(this.extend(this.data, data));
    }
});

module.exports = Template;