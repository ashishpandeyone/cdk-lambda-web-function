// E2E fixture server (v2). Reports which version and region served the request.
const http = require('node:http');

const [host, port] = process.env.AWS_LAMBDA_HTTP_ENDPOINT.split(':');
http.createServer((req, res) => {
  console.log(JSON.stringify({ msg: 'e2e-request', version: 'v2', path: req.url }));
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ version: 'v2', appVersion: process.env.APP_VERSION, region: process.env.AWS_REGION }));
}).listen(Number(port), host);
