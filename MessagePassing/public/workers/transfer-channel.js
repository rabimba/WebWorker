self.setupPort = function() {
  self.port.onmessage = function(msg) {
    try {
      var buf = createTransferable(expandTransferable(msg.data));
      self.port.postMessage(buf, [buf]);
    } catch (e) {
      throw e;
    }
  }
};

self.onmessage = function(msg) {
  if (msg.ports[0]) {
    self.port = msg.ports[0];
    self.setupPort();
    self.onmessage = null;
  }
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
