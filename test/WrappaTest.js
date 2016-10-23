import sinon from "sinon";
import expect from "./baseTest";
import Wrappa from "../src/Wrappa";
import {DELAYER_FN_NAME_PREFIX} from "../src/Wrappa";

const VALID_FACTORY_FN = () => {};
import VALID_CLASS from "./mock/ValidClass";
const VALID_CONNECTION_CLASS_MOCK = {publish: () => true, subscribe: () => true};
const VALID_CONNECTION_CLASS_METHODS = ["publish", "subscribe"];

var sandbox;
beforeEach("prepare sandbox", () => sandbox = sinon.sandbox.create());
afterEach("reset sandbox", () => sandbox.restore());

describe("Wrappa", () => {
    var instance, random;
    beforeEach("create instance", () => {
        instance = new Wrappa(VALID_FACTORY_FN, VALID_CLASS)
        random = Math.random();
    });

    it("should export a function",
        () => expect(Wrappa).to.be.function);
    it("should construct with valid arguments",
        () => expect(() => new Wrappa(VALID_FACTORY_FN, VALID_CLASS)).to.not.throw());
    it("should throw error when constructed without arguments",
        () => expect(() => new Wrappa()).to.throw());
    it("should throw error when constructed with one argument",
        () => expect(() => new Wrappa(VALID_FACTORY_FN)).to.throw());
    it("should throw error when constructed with invalid argument",
        () => expect(() => new Wrappa(false, VALID_CLASS)).to.throw());

    describe("getConnection()", () => {
        beforeEach("recreate instance", () => {
            sandbox.stub(instance, "connectionFactoryFn");
            instance.connectionFactoryFn.resolves(random);
        });

        it("should have a getConnection() function",
            () => expect(instance.getConnection).to.be.function);

        it("should return a promise",
            () => expect(instance.getConnection()).to.be.instanceOf(Promise));

        it("should return the same promise when connecting",
            () => expect(instance.getConnection()).to.equal(instance.getConnection()));

        it("should store the connection once it's ready",
            () => instance.getConnection().then(() => expect(instance.connection).to.be.not.null));

        it("should store the connection returned by the factory fn",
            () => instance.getConnection().then(() => expect(instance.connection).to.equal(random)));

        it("should call the factory fn only once", () => {
            return instance.getConnection()
                .then(() => instance.getConnection())
                .then(() => expect(instance.connectionFactoryFn).to.have.callCount(1));
        });
    });

    describe("isConnected()", () => {
        it("should return true when started connecting and there's a connection", () => {
            instance.startedConnecting = true;
            instance.connection = {};
            expect(instance.isConnected()).to.be.true;
        });

        it("should return false when it haven't started connecting", () => {
            instance.startedConnecting = false;
            expect(instance.isConnected()).to.be.false;
        });

        it("should return false when it started connecting but there's no connection ", () => {
            instance.startedConnecting = true;
            instance.connection = null;
            expect(instance.isConnected()).to.be.false;
        });
    });

    describe("getWrappedConnectionClass()", () => {
        beforeEach("stub", () => {
            sandbox.stub(instance, "wrapConnectionClass");
            instance.wrapConnectionClass.returns(random);
        });


        it("should return the value of wrapConnectionClass",
            () => expect(instance.getWrappedConnectionClass()).to.equal(random));

        it("should cache the connection", () => {
            instance.getWrappedConnectionClass();
            instance.getWrappedConnectionClass();
            expect(instance.wrapConnectionClass).to.have.callCount(1);
        });
    });

    describe("wrapConnectionClass()", () => {
        const GET_DELAYED_FN_NAME_ARG_NUMBER = 0;

        beforeEach("stub", () => {
            sandbox.stub(instance, "getConnectionClassProtoMethods");
            sandbox.stub(instance, "getMockForConnectionClassMethods");
            sandbox.stub(instance, "getDelayerFunctionForConnectionClassFunction");
            instance.getConnectionClassProtoMethods.returns(VALID_CONNECTION_CLASS_METHODS);
            instance.getMockForConnectionClassMethods.returns(VALID_CONNECTION_CLASS_MOCK);
            instance.getDelayerFunctionForConnectionClassFunction.returns(random);
        });

        it("should return an object", () => expect(instance.getWrappedConnectionClass()).to.be.instanceOf(Object));

        it("should call getConnectionClassProtoMethods", () => {
            instance.getWrappedConnectionClass();
            expect(instance.getConnectionClassProtoMethods).to.have.callCount(1);
        });

        it("should call getMockForConnectionClassMethods", () => {
            instance.getWrappedConnectionClass();
            expect(instance.getMockForConnectionClassMethods).to.have.callCount(1);
        });

        it("should call getMockForConnectionClassMethods with valid method list", () => {
            instance.getWrappedConnectionClass();
            expect(instance.getMockForConnectionClassMethods).to.have.callCount(1);

            let args = instance.getMockForConnectionClassMethods.getCall(0).args;
            expect(args).to.have.lengthOf(1);

            let methodListArgument = args[0];
            expect(methodListArgument).to.equal(VALID_CONNECTION_CLASS_METHODS);
        });

        it("should call getDelayerFunctionForConnectionClassFunction for each function", () => {
            instance.getWrappedConnectionClass();
            expect(instance.getDelayerFunctionForConnectionClassFunction).to.have.callCount(VALID_CONNECTION_CLASS_METHODS.length);
        });

        it("should call getDelayerFunctionForConnectionClassFunction with each function name", () => {
            instance.getWrappedConnectionClass();
            for(var i = 0; i < VALID_CONNECTION_CLASS_METHODS.length; i++) {
                let getDelayerArguments = instance.getDelayerFunctionForConnectionClassFunction.getCall(i).args;
                expect(getDelayerArguments[GET_DELAYED_FN_NAME_ARG_NUMBER]).to.equal(VALID_CONNECTION_CLASS_METHODS[i]);
            }
        });

        it("should return an object with the keys changed to the return of getDelayer..()", () => {
            let obj = instance.getWrappedConnectionClass();
            for(var i = 0; i < VALID_CONNECTION_CLASS_METHODS.length; i++) {
                expect(obj[VALID_CONNECTION_CLASS_METHODS[i]]).to.equal(random);
            }
        });
    });

    describe("getMockForConnectionClassMethods()", () => {
        it("should return an object",
            () => expect(instance.getMockForConnectionClassMethods(VALID_CONNECTION_CLASS_METHODS)).to.be.object);

        it("should contain keys for all the methods",
            () => expect(instance.getMockForConnectionClassMethods(VALID_CONNECTION_CLASS_METHODS))
                .to.have.keys(VALID_CONNECTION_CLASS_METHODS));

        const protoFnName = VALID_CONNECTION_CLASS_METHODS[0]
        it("should copy functions from prototype",
            () => expect(instance.getMockForConnectionClassMethods(VALID_CONNECTION_CLASS_METHODS)[protoFnName])
                .to.equal(VALID_CLASS.prototype[protoFnName]));
   });

    describe("getDelayerFunctionForConnectionClassFunction()", () => {
        const validProtoFnName = VALID_CONNECTION_CLASS_METHODS[0];
        it("should return a function",
            () => expect(instance.getDelayerFunctionForConnectionClassFunction(validProtoFnName)).to.be.function);

        const expectedGeneratedName = `${DELAYER_FN_NAME_PREFIX}${validProtoFnName}`;
        it("the name of the original fn should be prefixed correctly in the wrapper fn",
            () => expect(instance.getDelayerFunctionForConnectionClassFunction(validProtoFnName).name).to.equal(expectedGeneratedName));
    });
});