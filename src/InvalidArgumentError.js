export default class InvalidArgumentError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.stack = (new Error()).stack;
        this.name = this.constructor.name;
    }
}