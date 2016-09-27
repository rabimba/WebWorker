# WebWorker

JavaScript by design is not single threaded. And the only way to run it in parallel will be to use `Virtual Threading` 

### queries

- Will the threads have access to shared resources/scopes?

  -> No.

- How do they communicate?

  -> They can pass messages between them

## How does it work

WebWorker is a feature of the browser. The langugae does not support threaded execution. The browser in case of webworker creates multiple instances of the JavaScript engine. Each program runs in its own thread. These threads are `workers` . It follows the `Task Parallelism` construct.

##### Spawning up a worker

`var w1 = new Worker( "http://some.url.1/mycoolworker.js" );`

This is an example of a dedicated worker. It creates an independent thread and runs the javascript file within that. The `w1` Worker object is an event listener and trigger, which lets you subscribe to events sent by the Worker as well as send events to the Worker. 

```
w1.addEventListener( "message", function(evt){
    // evt.data
} );
```

And you can send the `"message"` event to the Worker:

```
w1.postMessage( "something cool to say" );
```

Inside the Worker, the messaging is totally symmetrical:

```
// "mycoolworker.js"

addEventListener( "message", function(evt){
    // evt.data
} );

postMessage( "a really cool reply" );
```

Notice that a dedicated Worker is in a one-to-one relationship with the program that created it. That is, the `"message"` event doesn't need any disambiguation here, because we're sure that it could only have come from this one-to-one relationship -- either it came from the Worker or the main page.

Usually the main page application creates the Workers, but a Worker can instantiate its own child Worker(s) -- known as subworkers -- as necessary. Sometimes this is useful to delegate such details to a sort of "master" Worker that spawns other Workers to process parts of a task

To kill a Worker immediately from the program that created it, call `terminate()` on the Worker object 

## Inside a Worker

Inside the Worker, you do not have access to any of the main program's resources. That means you cannot access any of its global variables, nor can you access the page's DOM or other resources. Remember: it's a totally separate thread.

External scripts can be loaded in the worker though

```
// inside the Worker
importScripts( "foo.js", "bar.js" );
```
## What a worker can't do
A worker doesnt have access to DOM eliments. So rendering cannot be done using worker

## Data Transfer

1. Serializing data to string value. In this case data gets copied