const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const protoFile = path.join(__dirname, 'example.proto');

const packageDefinition = protoLoader.loadSync(protoFile, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const exampleProto = grpc.loadPackageDefinition(packageDefinition).example;

const client = new exampleProto.Example('localhost:3456', grpc.credentials.createInsecure());

const originalHello = client.hello.bind(client);
client.hello = (params) => new Promise((resolve, reject) => {
  originalHello(params, (err, response) => {
    if (err) reject(err);
    else resolve(response);
  });
});
const originalHello2 = client.hello2.bind(client);
client.hello2 = (params) => new Promise((resolve, reject) => {
  originalHello2(params, (err, response) => {
    if (err) reject(err);
    else resolve(response);
  });
});

module.exports = client;
