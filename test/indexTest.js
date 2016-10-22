import expect from "./baseTest";
import index from "../src/index";
import Wrappa from "../src/Wrappa";

describe("index", () => {
    it("should export a function", () => expect(index).to.be.function);
    it("should should export Wrappa", () => expect(index).to.equal(Wrappa));
});