type ClassInstance = {}

type ClassObject = {
    new(params?: Object, ...otherProps): ClassInstance
    extend(instance?: Object): ClassObject
}

export default class Component {
    static get(name: string, params: Object): ClassObject | any;
    static add(name: string, module: ClassObject): ClassObject | any;
}
