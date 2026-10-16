// E2E fixture server (v1). Reports which version and region served the request, and echoes the method,
// the Authorization header and the body size (CloudFront checks).
const http = require('node:http');

const [host, port] = process.env.AWS_LAMBDA_HTTP_ENDPOINT.split(':');
http.createServer((req, res) => {
  console.log(JSON.stringify({ msg: 'e2e-request', version: 'v1', path: req.url }));
  // FAIL=true answers every request with a 500, to trip an endpoint's rollbackOn alarm.
  if (process.env.FAIL === 'true') res.statusCode = 500;
  let bodyBytes = 0;
  req.on('data', (chunk) => { bodyBytes += chunk.length; });
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      version: 'v1', appVersion: process.env.APP_VERSION, region: process.env.AWS_REGION,
      method: req.method, authorization: req.headers.authorization ?? null, bodyBytes,
    }));
  });
}).listen(Number(port), host);
