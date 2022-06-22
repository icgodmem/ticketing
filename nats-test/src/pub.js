const sc = require('node-nats-streaming').connect('test-cluster', 'test');

sc.on('connect', () => {
  // Simple Publisher (all publishes are async in the node version of the client)
  sc.publish('foo', 'Hello node-nats-streaming!', (err, guid) => {
    if (err) {
      console.log('publish failed: ' + err);
    } else {
      console.log('published message with guid: ' + guid);
    }
  });
});
