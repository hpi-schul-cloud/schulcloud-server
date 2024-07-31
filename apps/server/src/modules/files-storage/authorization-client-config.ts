import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationClientConfig } from '@src/infra/authorization-client/authorization-client.module';

export const authorizationClientConfig: AuthorizationClientConfig = {
	basePath: `${Configuration.get('API_HOST') as string}/v3/`,
};
