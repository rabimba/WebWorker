# WebWorker Message Passing Performance Test - http://seclab03.cs.rice.edu/webworker/MessagePass/

This repo tests the message passing speed between the main thread and a worker thread
for each of the following situations as available:

- strings: `Worker.postMessage(<String>)`
- json transfer/structured cloning: `Worker.postMessage(<Object>)`
- transferable objects: `Worker.postMessage(<Object>, [transferables])`

- channel strings: `channel.postMessage(<String>)`
- channel json transfer/structured cloning: `channel.postMessage(<Object>)`
- channel transferable objects: `channel.postMessage(<Object>, [transferables])`

Each test is run with 2 data setups.

Also note, many data formats can be used only when not using `JSON.stringify` unless
a bespoke implementation of stringify is created. For instance, stringify misses out
in these areas:

- duplicating/transferring RegExp objects.
- duplicating/transferring Blob, File, and FileList objects.
- duplicating/transferring ImageData objects. The dimensions of the clone's CanvasPixelArray will match the original and have a duplicate of the same pixel data.
- duplicating/transferring objects containing cyclic graphs of references.

This means that even in cases where using `JSON.stringify` is marginally faster, once these
cases are accounted for it's likely to be slower.

Each test measures round trips: e.g. the time it takes to serialize, send, receive a response,
and parse the response.  This means this test is biased towards operations that expect a response,
while many good setups communicate only worker to main thread. A fair test would test
the main thread overhead of processing a response.

## Test Setup

### What is tested here

- We measured start and end time with window.performance.now, and averaged together the results of 10 test runs of 1000 trips for each message transfer method
- We tested two different forms of messages, a "simple" object consisting of a wrapper with a payload consisting of an array of 100 strings, and a "complex" object using a similar wrapper but containing an array of 100 objects.
- Each test measures the total amount of time it takes to make a round trip beginning on the main thread. This means time it takes to serialize the payload into something the transfer method can use, deserialize it on the other end (ostensibly to use it), re-serialize it for transfer back, and de-serialize it again on the main thread. E.G. this measure the time it takes to complete a full request-response cycle

### Scenarios for which this is NOT a good benchmark include:

- operations that don't expect a response
- unidirectional operations (serialization cost only paid once, likely only by worker)
- operations that are triggered by a simple signal from the main thread but for which the worker will return a heavy payload