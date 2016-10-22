import chai from "chai";
import sinonChai from "sinon-chai";
import Promise from "bluebird";
import sinonAsPromised from "sinon-as-promised";

chai.use(sinonChai);
sinonAsPromised(Promise);

export default chai.expect;