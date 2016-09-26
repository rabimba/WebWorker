(function() {
  var SYSTEM_QUERY_TYPE = '-system-query';
  var PAYLOAD_TYPE = '-payload';
  var GUID = 1;
  var TOTAL_RUNS = 10;

  function Payload(data) {
    this.type = PAYLOAD_TYPE;
    this.id = 'ui-' + (GUID++);
    this.data = data;
  }

  function PayloadData(type, i) {
    this.name = 'worker-test-obj-' + i;
    var data = [];
    var j;
    if (type === 'simple') {
      for (j = 0; j < 100; j++) {
        data.push('payload-item-' + j);
      }
    } else {
      for (j = 0; j < 100; j++) {
        data.push({ name: 'payload-item-' + j, value: j });
      }
    }
    this.data = data;
  }

  function WorkerTest(options) {
    this.worker = new Worker('./workers/test.js');
    this.log = options.log;
    this.runners = {
      'json': new JsonTest('json', options.log),
      'json-channel': new ChannelJsonTest('json-channel', options.log),
      'strings': new StringTest('strings', options.log),
      'strings-channel': new ChannelStringTest('strings-channel', options.log),
      'transfer': new TransferTest('transfer', options.log),
      'transfer-channel': new ChannelTransferTest('transfer-channel', options.log)
    };

    this.run();
  }

  WorkerTest.prototype._send = function _sendWorkerData(data, buffers) {
    if (buffers) {
      this.worker.postMessage(data, buffers);
    } else {
      this.worker.postMessage(data);
    }
  };

  WorkerTest.prototype.detectFeatures = function _detectWorkerFeatures() {
    var _test = this;
    return new RSVP.Promise(function(resolve) {
      var features = {
        strings: true,
        json: false,
        cloning: false,
        transfer: false,
        channels: false
      };

      // check JSON transfer
      try {
        _test._send({
          type: SYSTEM_QUERY_TYPE,
          name: 'json-transfer',
          data: { name: 'JSON usability test' }
        });
        features.json = true;
      } catch (e) {
        // Worker does not support anything but strings
      }

      if (features.json) {
        //detect Structured Cloning and Transferable Objects
        if (typeof ArrayBuffer !== 'undefined') {
          try {
            const ab = new ArrayBuffer(1);

            _test._send({
              type: SYSTEM_QUERY_TYPE,
              name: 'buffer-transfer',
              data: ab
            }, [ab]);

            // if the byteLength is 0, the content of the buffer was transferred
            features.transfer = !ab.byteLength;
            features.cloning = !features.transfer;

          } catch (e) {
            // neither feature is available
          }
        }
      }

      // check channels
      if (typeof MessageChannel !== 'undefined') {
        features.channels = true;
      }

      resolve(features);
    });
  };

  WorkerTest.prototype.logFinalResults = function logFinalResults(test, type) {

    var avg = test.runs[type].reduce(function(v, c) {
      return v + c;
    }, 0);

    this.log({
      type: 'final-result',
      data: {
        type: type,
        label: test.name,
        value: (avg / 10) + 'ms'
      }
    });
  };

  WorkerTest.prototype.logTestResults = function logTestResults(test, type) {
    var avg = Object.keys(test.trips).reduce(function(value, trip) {
      return value + test.trips[trip].getDuration();
    }, 0);

    this.log({
      type: 'result',
      data: {
        type: type,
        label: test.name,
        value: (avg / 1000) + 'ms'
      }
    });

    // clean up
    test.runs[type].push((avg / 1000));

    if (test.runs[type].length === TOTAL_RUNS) {
      this.logFinalResults(test, type);
    }

    test.trips = {};

    return true;
  };

  WorkerTest.prototype.runTest = function _testWorker(test, type) {
    var _tests = this;
    var runs = [];
    var i;
    for (i = 1; i <= 1000; i++) {
      runs.push(i);
    }

    return runs.reduce(function(chain, run) {
      return chain
        .then(function() { return test.send(new PayloadData(type, run)); });
    }, test.ready)
      .then(_tests.logTestResults.bind(_tests, test, type))
      .catch(function(e) { return true; /* keep testing */ });
  };

  WorkerTest.prototype.chainTests = function _chainTests(tests, type) {
    var _test = this;
    return tests.reduce(function(chain, test) {
      return chain
        .then(_test.runTest.bind(_test, test, type));
    }, RSVP.Promise.resolve());
  };

  WorkerTest.prototype.runOnce = function(tests) {
    return this.chainTests(tests, 'simple')
      .then(this.chainTests.bind(this, tests, 'complex'));
  };

  WorkerTest.prototype.run = function _runWorkerTests() {
    var _test = this;
    this.detectFeatures()
      .then(function(features) {

        // print the compat matrix
        Object.keys(features).forEach(function(f) {
          _test.log({
            type: 'feature',
            data: {
              label: f,
              value: features[f] ? 'true' : 'false'
            }
          });
        });

        // generate test scenarios
        var tests = [];

        // basic scenarios
        Object.keys(features).forEach(function(f) {
          if (features[f] && ['cloning', 'channels'].indexOf(f) === -1) {
            tests.push(_test.runners[f]);
          }
        });

        // channel scenarios
        if (features['channels']) {
          Object.keys(features).forEach(function(f) {
            if (features[f] && ['cloning', 'channels'].indexOf(f) === -1) {
              tests.push(_test.runners[f + '-channel']);
            }
          });
        }

        var runs = [];
        for (var i = 0; i < TOTAL_RUNS; i++) {
          runs.push(i);
        }
        return runs.reduce(function(chain) {
          return chain.then(function() {
            return _test.runOnce(tests);
          });
        }, RSVP.Promise.resolve());
      });
  };

  // export this
  this.WorkerTest = WorkerTest;






  function Trip(id) {
    this.id = id;
    this._startTime = null;
    this._endTime = null;
    this._isComplete = RSVP.defer();

    var _trip = this;
    this.start = function() {
      if (!_trip._startTime) {
        _trip._startTime = window.performance.now();
      }
    };
    this.stop = function() {
      if (!_trip._endTime) {
        _trip._endTime = window.performance.now();
        _trip._isComplete.resolve();
      }
    };
    this.getDuration = function() {
      return _trip._endTime - _trip._startTime;
    };
    this.isComplete = this._isComplete.promise;
  }






  /*
    Base Test Class
   */
  function Test(name, log) {
    this.log = log;
    this.name = name;
    this.worker = new Worker('./workers/' + name + '.js');
    this.trips = {};
    this.runs = {
      simple: [],
      complex: []
    };

    this._ready = RSVP.defer();
    this.ready = this._ready.promise;
    this.setup();
  }
  Test.prototype.setup = function() {
    var _self = this;
    this.worker.onmessage = function() {
      _self.worker.onmessage = function(msg, opts) {
        _self.handle(msg, opts);
      };
      _self._ready.resolve();
    };
    if (this.name.indexOf('transfer') !== -1) {
      var buf = createTransferable({ hello: 'world' });
      this.worker.postMessage(buf, [buf]);
    } else {
      this.worker.postMessage(JSON.stringify({ hello: 'world' }));
    }
  };
  Test.prototype.initSend = function(data) {
    var request = new Payload(data);
    var trip = new Trip(request.id);
    this.trips[request.id] = trip;
    trip.start();
    return request;
  };
  Test.prototype.complete = function(data) {
    var trip = this.trips[data.id];
    trip.stop();
  };


  function ChannelTest() {
    Test.apply(this, arguments);
  }
  ChannelTest.prototype = Object.create(Test.prototype);
  ChannelTest.prototype.setup = function() {
    var _self = this;
    this.channel = new MessageChannel();
    this.channel.port1.onmessage = function() {
      if (_self.name === 'transfer-channel') {
        _self.log({
          type: 'feature',
          data: {
            label: 'Channel + Transferables',
            value: 'true'
          }
        });
      }

      _self.channel.port1.onmessage = function(msg, opts) {
        _self.handle(msg, opts);
      };
      _self._ready.resolve();
    };

    this.worker.postMessage('Sending Channel', [this.channel.port2]);
    this.worker.onerror = function() {
      if (_self.name === 'transfer-channel') {
        _self.log({
          type: 'feature',
          data: {
            label: 'Channel + Transferables',
            value: 'false'
          }
        });
        _self._ready.reject();
      }
    };

    if (this.name.indexOf('transfer') !== -1) {
      var buf = createTransferable({ hello: 'world' });
      this.channel.port1.postMessage(buf, [buf]);
    } else {
      this.channel.port1.postMessage(JSON.stringify({ hello: 'world' }));
    }
  };


  // String tests
  function StringTest() {
    Test.apply(this, arguments);
  }
  StringTest.prototype = Object.create(Test.prototype);
  StringTest.prototype.send = function(data) {
    var payload = this.initSend(data);
    this.worker.postMessage(JSON.stringify(payload));
    return this.trips[payload.id].isComplete;
  };
  StringTest.prototype.handle = function(msg) {
    var data = JSON.parse(msg.data);
    this.complete(data);
  };

  function ChannelStringTest() {
    ChannelTest.apply(this, arguments);
  }
  ChannelStringTest.prototype = Object.create(ChannelTest.prototype);
  ChannelStringTest.prototype.send = function(data) {
    var payload = this.initSend(data);
    this.channel.port1.postMessage(JSON.stringify(payload));
    return this.trips[payload.id].isComplete;
  };
  ChannelStringTest.prototype.handle = function(msg) {
    var data = JSON.parse(msg.data);
    this.complete(data);
  };

  // Json tests
  function JsonTest() {
    Test.apply(this, arguments);
  }
  JsonTest.prototype = Object.create(Test.prototype);
  JsonTest.prototype.send = function(data) {
    var payload = this.initSend(data);
    this.worker.postMessage(payload);
    return this.trips[payload.id].isComplete;
  };
  JsonTest.prototype.handle = function(msg) {
    this.complete(msg.data);
  };

  function ChannelJsonTest() {
    ChannelTest.apply(this, arguments);
  }
  ChannelJsonTest.prototype = Object.create(ChannelTest.prototype);
  ChannelJsonTest.prototype.send = function(data) {
    var payload = this.initSend(data);
    this.channel.port1.postMessage(payload);
    return this.trips[payload.id].isComplete;
  };
  ChannelJsonTest.prototype.handle = function(msg) {
    this.complete(msg.data);
  };

  // Transfer tests
  function TransferTest() {
    Test.apply(this, arguments);
  }
  TransferTest.prototype = Object.create(Test.prototype);
  TransferTest.prototype.send = function(data) {
    var payload = this.initSend(data);
    var buf = createTransferable(payload);
    this.worker.postMessage(buf, [buf]);
    return this.trips[payload.id].isComplete;
  };
  TransferTest.prototype.handle = function(msg) {
    this.complete(expandTransferable(msg.data));
  };

  function ChannelTransferTest() {
    ChannelTest.apply(this, arguments);
  }
  ChannelTransferTest.prototype = Object.create(ChannelTest.prototype);
  ChannelTransferTest.prototype.send = function(data) {
    var payload = this.initSend(data);
    var buf = createTransferable(payload);
    this.channel.port1.postMessage(buf, [buf]);
    return this.trips[payload.id].isComplete;
  };
  ChannelTransferTest.prototype.handle = function(msg) {
    this.complete(expandTransferable(msg.data));
  };


  function expandTransferable(buf) {
    var str = String.fromCharCode.apply(null, new Uint16Array(buf));
    return JSON.parse(str);
  }

  function createTransferable(o) {
    var str = JSON.stringify(o);
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

})(window);
