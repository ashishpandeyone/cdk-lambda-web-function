import { GetWebFunctionEndpointCommand, LambdaWebClient } from '@aws-sdk/client-lambda-web';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { handler } from '../../handlers/web-function-provider/index';
import { ENDPOINT_LOOKUP_RESOURCE_TYPE } from '../../src/private/provider-protocol';

const web = mockClient(LambdaWebClient);
const props = {
  FunctionArn: 'arn:aws:lambda:ap-south-1:111111111111:web-function/api',
  EndpointName: 'default-1a2b3c4d',
  EndpointArn: 'arn:aws:lambda:ap-south-1:111111111111:web-function/api/endpoint/default-1a2b3c4d',
};

beforeEach(() => web.reset());

test('returns each regional domain as Domain.<region>', async () => {
  web.on(GetWebFunctionEndpointCommand).resolves({
    regionalEndpoints: {
      'ap-south-1': { domainName: 'x.jrz.lambda-web.ap-south-1.on.aws' } as any,
      'us-east-1': { domainName: 'x.jrz.lambda-web.us-east-1.on.aws' } as any,
    },
  } as any);

  const res = await handler(cfnEvent('Create', ENDPOINT_LOOKUP_RESOURCE_TYPE, props));

  expect(res).toEqual({
    PhysicalResourceId: props.EndpointArn,
    Data: {
      'Domain.ap-south-1': 'x.jrz.lambda-web.ap-south-1.on.aws',
      'Domain.us-east-1': 'x.jrz.lambda-web.us-east-1.on.aws',
    },
  });
  expect(web.commandCalls(GetWebFunctionEndpointCommand)[0].args[0].input).toEqual({ functionName: props.FunctionArn, endpointName: 'default-1a2b3c4d' });
  expect(await web.call(0).thisValue.config.region()).toBe('ap-south-1');
});

test('returns no domains for a MultiRegion endpoint (it only has the global domain)', async () => {
  web.on(GetWebFunctionEndpointCommand).resolves({ regionalEndpoints: { 'ap-south-1': {} as any, 'us-east-1': {} as any } } as any);

  const res = await handler(cfnEvent('Create', ENDPOINT_LOOKUP_RESOURCE_TYPE, props));

  expect(res.Data).toEqual({});
});

test('does nothing on delete', async () => {
  const res = await handler(cfnEvent('Delete', ENDPOINT_LOOKUP_RESOURCE_TYPE, props, props.EndpointArn));

  expect(res).toEqual({ PhysicalResourceId: props.EndpointArn });
  expect(web.calls()).toHaveLength(0);
});

test('rejects unknown resource types, but accepts deleting them (a rollback to this version after an upgrade)', async () => {
  await expect(handler(cfnEvent('Create', 'Custom::Unknown', {}))).rejects.toThrow('Unsupported resource type: Custom::Unknown');
  await expect(handler(cfnEvent('Update', 'Custom::Unknown', {}))).rejects.toThrow('Unsupported resource type: Custom::Unknown');
  jest.spyOn(console, 'log').mockImplementation(() => {});
  await expect(handler(cfnEvent('Delete', 'Custom::Unknown', {}, 'id-1'))).resolves.toEqual({ PhysicalResourceId: 'id-1' });
});
