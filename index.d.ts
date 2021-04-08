/**
 * Declaration for ipsp-js-sdk
 * checkout.min.js version: v2.0.0
 */

declare module 'ipsp-js-sdk' {
    type ClassInstance = {

    }
    type ClassObject = {
        new(params?: Object, ...otherProps): ClassInstance
        extend(instance?: Object): ClassObject
    }
    export default class Component {
        static get(name:string,params:Object): ClassObject | any;
        static add(name:string, module: ClassObject ): ClassObject | any;
    }
}

