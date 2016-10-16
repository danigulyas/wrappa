import _ from "lodash";
export default class Wrappa {
    /**
     * @param {Function} connectionFactoryFn is responsible for returning an actual connection which the calls be executed from.
     * @param connectionClass is the "class" which is containing the methods.
     */
    constructor(connectionFactoryFn, connectionClass) {
        this.connection = null;
        this.connectionPromise = null;
        this.startedConnecting = false;
        this.wrappedConnectionClass = null;

        this.connectionFactoryFn = connectionFactoryFn;
        this.connectionClass = connectionClass;
    }

    getConnection() {
        if (this.isConnected()) return Promise.resolve(this.connection);
        if (this.startedConnecting) return this.connectionPromise;

        this.connectionPromise = this.connectionFactoryFn().tap(connection => {
            this.connection = connection;
        }).catch(err => {
            console.error(err, "The promise returned by the connection factory ran into an exception.");
        });

        this.startedConnecting = true;
        return this.connectionPromise;
    }

    isConnected() {
        return this.startedConnecting && this.connection !== null;
    }

    /**
     * Returns a mock of the connection class where all the calls are available, but delayed until the connectionFactoryFn
     * returns a connection to call the actual methods on.
     * @return {Object} A mock of the ConnectionClass with promise delaying.
     */
    getWrappedConnectionClass() {
        if (this.wrappedConnectionClass) return this.wrappedConnectionClass;

        this.wrappedConnectionClass = this.wrapConnectionClass();
        return this.wrappedConnectionClass;
    }

    wrapConnectionClass() {
        let methods = this.getConnectionClassProtoMethods();
        let mock = this.getMockForConnectionClassMethods(methods);

        mock.forEach(name => mock[name] = this.getDelayerFunctionForConnectionClassFunction(name));

        return mock;
    }

    /**
     * Returns own functions in prototype
     * @return {Array<String>} methods;
     */
    getConnectionClassProtoMethods() {
        let proto = this.connectionClass.prototype;
        let methods = Object.keys(proto);

        return methods.filter(keyName => proto.hasOwnProperty(keyName) && _.isFunction(proto[keyName]));
    }

    /**
     * Returns a mock for given methods from the connectionClass.
     * @param {Array<String>} methods from the proto of ConnectionClass
     * @return {{}} Object with keys as methods and values as functions of method from the proto
     */
    getMockForConnectionClassMethods(methods) {
        let proto = this.connectionClass.proto;
        let mock = {};

        methods.forEach(name => mock[name] = proto[name]);
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
            const argArray = args;

            return this.getConnection().then(conn => {
                return conn[name](...argArray);
            });
        };

        fn.name = `wrapperForConnectorFn${ name }`;
        return fn;
    }

}