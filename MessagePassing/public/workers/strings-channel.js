self.setupPort = function() {
  self.port.onmessage = function(e) {
    self.port.postMessage(JSON.stringify(JSON.parse(e.data)));
  }
};

self.onmessage = function(msg) {
  if (msg.ports[0]) {
    self.port = msg.ports[0];
    self.setupPort();
    self.onmessage = null;
  }
};
