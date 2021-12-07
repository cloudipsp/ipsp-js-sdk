type ClassObject = {
    new(params?: Object, ...otherProps): ClassObject
    extend(instance?: Object): ClassObject
}
