type ClassInstance = {}

type ClassObject = {
    new(params?: Object, ...otherProps): ClassInstance
    extend(instance?: Object): ClassObject
}