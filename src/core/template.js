const {ClassObject} = require('./class');
const Views = require('../views');

function empty(name){
    return function(data){
        return ['template',name,'not found'].join(' ')
    }
}

exports.Template = ClassObject.extend({
    init(name) {
        this.view = Views[name] || empty(name);
    },
    render(data) {
        return this.view(data)
    }
});

