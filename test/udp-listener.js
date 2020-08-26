const dgram = require('dgram');

function readUdpMessage() {
  const server = dgram.createSocket('udp4');
  server.bind(2000);

  return new Promise((resolve, reject) => {
    server.on('err', (err) => {
      reject(err);
      server.close();
    });

    server.once('message', (msg) => {
      const messages = msg
        .toString()
        .split('\n')
        .map((m) => JSON.parse(m));
      resolve(messages);
      server.close();
    });
  });
}

module.exports = readUdpMessage;
