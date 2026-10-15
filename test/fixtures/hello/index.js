const http = require('node:http');
const [host, port] = process.env.AWS_LAMBDA_HTTP_ENDPOINT.split(':');
http.createServer((req, res) => res.end('hello')).listen(Number(port), host);
