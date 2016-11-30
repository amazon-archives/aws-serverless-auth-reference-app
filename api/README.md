# spacefinder-api

lambda/data

Contains base class for tables with LocationTable extending this class. These classes and methods are wrappers to DynamoDB calls.

```
gulp create_tables
```
will create any defined table

In order to have prefix, config.js will contain the prefix for resources.

lambda/index.js

These are the handlers of the lambda functions which expose a CRUD interface
on the resources.

There is a test on

test/lambda/locations.spec.js

To run the tests

```
mocha **/*.spec.js
```

This will run all tests, all tests end in *.spec.js
