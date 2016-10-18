import expect from "../abstractBaseTest";
import sinon from "sinon";
import amqplib from "amqplib";
import ChannelModel from "amqplib/lib/channel_model";

import Wrappa from "../../src/Wrappa";

var sandbox = sinon.sandbox.create();
beforeEach(() => sandbox = sinon.sandbox.create());
afterEach(() => sandbox.restore());

const CONNECTION_FACTORY_FN = () => amqplib.connect();

describe("amqplib 'e2e' test", () => {
    it("initiates properly", () => {
        expect(() => new Wrappa(CONNECTION_FACTORY_FN, ChannelModel)).to.not.throw();
    });
});

