import chai from "chai";
import sinonChai from "sinon-chai";
import sinonAsPromised from "sinon-as-promised"; //registers itself at sinon

chai.use(sinonChai);

export default chai.expect;