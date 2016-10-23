import _ from "lodash";
import InvalidArgumentError from "./InvalidArgumentError";
export const DELAYER_FN_NAME_PREFIX = "wrapperForConnectorFn";
export default class Wrappa {
    /**
     * @param {Function} connectionFactoryFn is responsible for returning an actual connection which the calls be executed from.
     * @param connectionClass is the "class" which is containing the methods.
     */
    constructor(connectionFactoryFn = null, connectionClass = null) {
        if(!connectionFactoryFn || !_.isFunction(connectionFactoryFn))
            throw new InvalidArgumentError("The first argument (connectFactoryFn) must be defined and must be a function.");
        if(!connectionClass)
            throw new InvalidArgumentError("The second argument (connectFactoryFn) must be defined.");

        this.connection = null;
        this.connectionPromise = null;
        this.startedConnecting = false;
        this.wrappedConnectionClass = null;

        this.connectionFactoryFn = connectionFactoryFn;
        this.connectionClass = connectionClass;
    }

    getConnection() {
        if(this.isConnected()) return Promise.resolve(this.connection);
        if(this.startedConnecting) return this.connectionPromise;

        this.connectionPromise = this.connectionFactoryFn().then((connection) => {
            this.connection = connection;
            return connection;
        }).catch((err) => {
            console.error(err, "The promise returned by the connection factory ran into an exception.");
        });

        this.startedConnecting = true;
        return this.connectionPromise;
    }

    isConnected() {
        return this.startedConnecting && (this.connection !== null);
    }

    /**
     * Returns a mock of the connection class where all the calls are available, but delayed until the connectionFactoryFn
     * returns a connection to call the actual methods on.
     * @return {Object} A mock of the ConnectionClass with promise delaying.
     */
    getWrappedConnectionClass() {
        if(this.wrappedConnectionClass) return this.wrappedConnectionClass;

        this.wrappedConnectionClass = this.wrapConnectionClass();
        return this.wrappedConnectionClass;
    }

    wrapConnectionClass() {
        let methods = this.getConnectionClassProtoMethods();
        let mock = this.getMockForConnectionClassMethods(methods);

        Object.keys(mock).forEach((name) => mock[name] = this.getDelayerFunctionForConnectionClassFunction(name));

        return mock;
    }

    /**
     * Returns own functions in prototype
     * @return {Array<String>} methods;
     */
    getConnectionClassProtoMethods() {
        let proto = this.connectionClass.prototype;
        let methods = Object.keys(proto);

        return methods.filter((keyName) => proto.hasOwnProperty(keyName) && _.isFunction(proto[keyName]));
    }

    /**
     * Returns a mock for given methods from the connectionClass.
     * @param {Array<String>} methods from the proto of ConnectionClass
     * @return {{}} Object with keys as methods and values as functions of method from the proto
     */
    getMockForConnectionClassMethods(methods) {
        let proto = this.connectionClass.prototype;
        let mock = {};

        methods.forEach((name) => mock[name] = proto[name]);
        return mock;
    }

    /**
     * Returns a function which is calling the given call with it's params from the original conn object
     * and returns a promise.
     * @param {String} name of the function to be wrapped
     * @return {Function} fn
     */
    getDelayerFunctionForConnectionClassFunction(name) {
        let fn = () => {
            const argArray = arguments;

            return this.getConnection()
                .then((conn) => {
                    return conn[name](...argArray);
                });
        };

        Object.defineProperty(fn, "name", {value: `${DELAYER_FN_NAME_PREFIX}${name}`});

        return fn;
    }
}

