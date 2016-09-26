self.onmessage = function(msg) {
  self.postMessage(JSON.stringify(JSON.parse(msg.data)));
};
