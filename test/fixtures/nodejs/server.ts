// NodejsWebFunction fixture: TypeScript, an AWS SDK client (the runtime has none), and a CommonJS
// dependency that require()s Node built-ins (what breaks ESM bundles without a require shim).
import * as http from 'node:http';
import { STSClient } from '@aws-sdk/client-sts';
// @ts-ignore untyped CommonJS module
import supportsColor from 'supports-color';

interface Probe {
  readonly ok: boolean;
  readonly region: string | undefined;
  readonly sdk: string;
  readonly commonJs: string;
  readonly stack: string;
}

function probe(): Probe {
  return {
    ok: true,
    region: process.env.AWS_REGION,
    sdk: typeof STSClient,
    commonJs: typeof supportsColor,
    stack: new Error('where am I').stack ?? '',
  };
}

const [host, port] = (process.env.AWS_LAMBDA_HTTP_ENDPOINT ?? '127.0.0.1:8080').split(':');
http.createServer((req, res) => {
  console.log(JSON.stringify({ msg: 'e2e-request', path: req.url }));
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(probe()));
}).listen(Number(port), host);
