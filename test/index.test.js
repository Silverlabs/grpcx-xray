const path = require('path');
const assert = require('assert');
const Grpcx = require('@silverlabs/grpcx');

const client = require('./client');
const readUdpMessage = require('./udp-listener');
const xrayMiddleware = require('../src');

describe('middleware', () => {
  let server;
  afterEach(() => {
    server.forceShutdown();
  });

  it('sends xray data to udp port 2000', async () => {
    const app = new Grpcx({
      protoFile: path.join(__dirname, 'example.proto'),
    });
    app.use(xrayMiddleware('test-app'));
    app.use('hello', ({ name }) => ({ message: `Hello ${name}` }));
    const messagePromise = readUdpMessage();
    server = await app.listen(3456);
    await client.hello({ name: 'a' });
    const messages = await messagePromise;
    assert.equal(messages.length, 2);
    assert.equal(messages[1].name, 'test-app');
  });

  it('captures errors in the segment', async () => {
    const app = new Grpcx({
      protoFile: path.join(__dirname, 'example.proto'),
      logger: { error: () => {} },
    });
    app.use(xrayMiddleware('test-app'));

    // Implementation will throw error
    app.use('hello', () => {
      throw new Error('Test error');
    });

    const messagePromise = readUdpMessage();
    server = await app.listen(3456);

    // Verify if error is received by client
    let errorThrown = null;
    try {
      await client.hello({ name: 'a' });
    } catch (err) {
      errorThrown = err;
    }
    assert.equal(errorThrown.details, 'Test error');

    // Verify if error is added to segment
    const messages = await messagePromise;
    assert.equal(messages.length, 2);
    assert.equal(messages[1].name, 'test-app');
    assert.equal(messages[1].fault, true);
    assert.equal(messages[1].cause.exceptions[0].message, 'Test error');
  });
});
