import { Test, TestingModule } from '@nestjs/testing';
import { Oauth2ToolConfigDO } from '@shared/domain/domainobject/tool';
import { ToolConfigType } from '@shared/domain';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { ExternalToolServiceMapper } from './external-tool-service.mapper';
import { TokenEndpointAuthMethod } from '../../interface';

describe('ExternalToolServiceMapper', () => {
	let module: TestingModule;
	let mapper: ExternalToolServiceMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ExternalToolServiceMapper],
		}).compile();

		mapper = module.get(ExternalToolServiceMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapDoToProviderOauthClient', () => {
		it('should map an Oauth2ToolConfigDO to a ProviderOauthClient', () => {
			const toolName = 'toolName';
			const oauth2Config: Oauth2ToolConfigDO = new Oauth2ToolConfigDO({
				type: ToolConfigType.OAUTH2,
				baseUrl: 'baseUrl',
				clientId: 'clientId',
				clientSecret: 'clientSecret',
				scope: 'offline openid',
				tokenEndpointAuthMethod: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
				redirectUris: ['reDir1', 'reDir2'],
				frontchannelLogoutUri: 'frontchannelLogoutUri',
				skipConsent: false,
			});
			const expected: ProviderOauthClient = {
				client_name: toolName,
				client_id: 'clientId',
				client_secret: 'clientSecret',
				scope: 'offline openid',
				token_endpoint_auth_method: 'client_secret_basic',
				redirect_uris: ['reDir1', 'reDir2'],
				frontchannel_logout_uri: 'frontchannelLogoutUri',
				subject_type: 'pairwise',
			};

			const result: ProviderOauthClient = mapper.mapDoToProviderOauthClient(toolName, oauth2Config);

			expect(result).toEqual(expected);
		});
	});
});
