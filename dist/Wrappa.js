"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DELAYER_FN_NAME_PREFIX = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _InvalidArgumentError = require("./InvalidArgumentError");

var _InvalidArgumentError2 = _interopRequireDefault(_InvalidArgumentError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DELAYER_FN_NAME_PREFIX = exports.DELAYER_FN_NAME_PREFIX = "wrapperForConnectorFn";

var Wrappa = function () {
    /**
     * @param {Function} connectionFactoryFn is responsible for returning an actual connection which the calls be executed from.
     * @param connectionClass is the "class" which is containing the methods.
     */
    function Wrappa() {
        var connectionFactoryFn = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        var connectionClass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        _classCallCheck(this, Wrappa);

        if (!connectionFactoryFn || !_lodash2.default.isFunction(connectionFactoryFn)) throw new _InvalidArgumentError2.default("The first argument (connectFactoryFn) must be defined and must be a function.");
        if (!connectionClass) throw new _InvalidArgumentError2.default("The second argument (connectFactoryFn) must be defined.");

        this.connection = null;
        this.connectionPromise = null;
        this.startedConnecting = false;
        this.wrappedConnectionClass = null;

        this.connectionFactoryFn = connectionFactoryFn;
        this.connectionClass = connectionClass;
    }

    _createClass(Wrappa, [{
        key: "getConnection",
        value: function getConnection() {
            var _this = this;

            if (this.isConnected()) return Promise.resolve(this.connection);
            if (this.startedConnecting) return this.connectionPromise;

            this.connectionPromise = this.connectionFactoryFn().then(function (connection) {
                _this.connection = connection;
                return connection;
            }).catch(function (err) {
                console.error(err, "The promise returned by the connection factory ran into an exception.");
            });

            this.startedConnecting = true;
            return this.connectionPromise;
        }
    }, {
        key: "isConnected",
        value: function isConnected() {
            return this.startedConnecting && this.connection !== null;
        }

        /**
         * Returns a mock of the connection class where all the calls are available, but delayed until the connectionFactoryFn
         * returns a connection to call the actual methods on.
         * @return {Object} A mock of the ConnectionClass with promise delaying.
         */

    }, {
        key: "getWrappedConnectionClass",
        value: function getWrappedConnectionClass() {
            if (this.wrappedConnectionClass) return this.wrappedConnectionClass;

            this.wrappedConnectionClass = this.wrapConnectionClass();
            return this.wrappedConnectionClass;
        }
    }, {
        key: "wrapConnectionClass",
        value: function wrapConnectionClass() {
            var _this2 = this;

            var methods = this.getConnectionClassProtoMethods();
            var mock = this.getMockForConnectionClassMethods(methods);

            Object.keys(mock).forEach(function (name) {
                return mock[name] = _this2.getDelayerFunctionForConnectionClassFunction(name);
            });

            return mock;
        }

        /**
         * Returns own functions in prototype
         * @return {Array<String>} methods;
         */

    }, {
        key: "getConnectionClassProtoMethods",
        value: function getConnectionClassProtoMethods() {
            var proto = this.connectionClass.prototype;
            var methods = Object.keys(proto);

            return methods.filter(function (keyName) {
                return proto.hasOwnProperty(keyName) && _lodash2.default.isFunction(proto[keyName]);
            });
        }

        /**
         * Returns a mock for given methods from the connectionClass.
         * @param {Array<String>} methods from the proto of ConnectionClass
         * @return {{}} Object with keys as methods and values as functions of method from the proto
         */

    }, {
        key: "getMockForConnectionClassMethods",
        value: function getMockForConnectionClassMethods(methods) {
            var proto = this.connectionClass.prototype;
            var mock = {};

            methods.forEach(function (name) {
                return mock[name] = proto[name];
            });
            return mock;
        }

        /**
         * Returns a function which is calling the given call with it's params from the original conn object
         * and returns a promise.
         * @param {String} name of the function to be wrapped
         * @return {Function} fn
         */

    }, {
        key: "getDelayerFunctionForConnectionClassFunction",
        value: function getDelayerFunctionForConnectionClassFunction(name) {
            var _arguments = arguments,
                _this3 = this;

            var fn = function fn() {
                var argArray = _arguments;

                return _this3.getConnection().then(function (conn) {
                    return conn[name].apply(conn, _toConsumableArray(argArray));
                });
            };

            Object.defineProperty(fn, "name", { value: "" + DELAYER_FN_NAME_PREFIX + name });

            return fn;
        }
    }]);

    return Wrappa;
}();

exports.default = Wrappa;