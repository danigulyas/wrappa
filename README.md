# wrappa
[![Build Status](https://travis-ci.org/danigulyas/wrappa.svg?branch=master)](https://travis-ci.org/danigulyas/wrappa) [![Coverage Status](https://coveralls.io/repos/github/danigulyas/wrappa/badge.svg?branch=master)](https://coveralls.io/github/danigulyas/wrappa?branch=master)

Promise-delayer and connection object stubber in order to be able to use async connectors with sync limitations.

### Synopsis
Example usage with [amqplib](https://www.npmjs.com/package/amqplib) in a factory for [electrolyte](https://www.npmjs.com/package/electrolyte).

```javascript
const amqp = require("amqplib");
const {ChannelModel} = require("amqplib/lib/channel_model");
const Wrappa = require("wrappa");

const connectionString = "justAnExampleConnectionString";

module.exports = function createRmqInstance() {
  return new Wrappa(() => amqp.connection(connectionString), ChannelModel).getWrappedConnectionClass();
};

module.exports["@require"] = ["base/configuration"];
module.exports["@singleton"] = true;
```

The fellow would return a mock equivalent for an instance of `ChannelModel`, every call will return a promise, they'll be
delayed until the connection function returns the connection then it'll be casted to the connection instance, by default there's lazyness built in, so the `connectionFactoryFn`
described upper will not be called until there's at least one call from the mock returned.


### API

##### Wrappa(connectionFactoryFn, ConnectionClass);

Returns an instance of Wrappa.

##### wrappa.getWrappedConnectionClass()

Returns a callable mock equivalent to `ConnectionClass`.

##### More

These are the main functions only, please find the rest at the tests.
 
### Why the heck i would use it anyways?

An example use-case:

Given that most IoC containers are sync, You might encounter the situation that 
You have to use a library which provides only async return of it's connection object, but You don't want to hack through
it yourself nor You want to add extra noise to every place where the lib is used to wait for the connection.

So You can then make a go with `Wrappa` and hopefully skip the suffering.

Code examples to be added.

### Questions, suggestions

Suggestions and constructive critique is highly appreciated, please feel free to drop me a line at `hello@danielgulyas.me`. :)
Questions also welcome!