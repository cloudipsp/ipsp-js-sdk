(function (global, name , factory) {
    (typeof exports === 'object' && typeof module !== 'undefined') ? module.exports = factory() :
        (typeof define === 'function' && define.amd) ? define(factory) : false;
}(this,'$checkout',function(){
    return $checkout;
}));