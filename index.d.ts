declare type ClassInstance = {

}

declare type ClassObject = {
    new(params?:Object,...otherProps): ClassInstance
    extend(instance?: Object): ClassObject
};