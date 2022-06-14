import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { OauthResponseMapper } from '@src/modules/system/mapper/oauth-response.mapper';
import { OauthResponse } from '@src/modules/system/controller/dto/oauth.response';
import { OauthConfigResponse } from '../controller/dto/oauth-config.response';

function assertOauthConfig(expected: OauthConfigDto, actual: OauthConfigResponse): boolean {
	expect(expected.clientId).toBe(actual.clientId);
	expect(expected.clientSecret).toBe(actual.clientSecret);
	expect(expected.tokenRedirectUri).toBe(actual.tokenRedirectUri);
	expect(expected.grantType).toBe(actual.grantType);
	expect(expected.tokenEndpoint).toBe(actual.tokenEndpoint);
	expect(expected.authEndpoint).toBe(actual.authEndpoint);
	expect(expected.responseType).toBe(actual.responseType);
	expect(expected.scope).toBe(actual.scope);
	expect(expected.provider).toBe(actual.provider);
	expect(expected.logoutEndpoint).toBe(actual.logoutEndpoint);
	expect(expected.issuer).toBe(actual.issuer);
	expect(expected.jwksEndpoint).toBe(actual.jwksEndpoint);
	expect(expected.codeRedirectUri).toBe(actual.codeRedirectUri);
	return true;
}

describe('oauth-response mapper', () => {
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [OauthResponseMapper],
		}).compile();
	});

	describe('mapFromDtoToResponse', () => {
		it('should map all given dtos', () => {
			// Arrange
			const defaultOauthConfigDto = new OauthConfigDto({
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				tokenRedirectUri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'mock_provider',
				logoutEndpoint: 'mock_logoutEndpoint',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
				codeRedirectUri: 'mock_codeRedirectUri',
			});
			const oauthConfigs: OauthConfigDto[] = [defaultOauthConfigDto, defaultOauthConfigDto];

			// Act
			const result: OauthResponse = OauthResponseMapper.mapFromDtoToResponse(oauthConfigs);

			// Assert
			expect(result.data.length).toEqual(oauthConfigs.length);
			for (let i = 0; i < result.data.length; i += 1) {
				assertOauthConfig(oauthConfigs[i], result.data[i]);
			}
		});
	});
});
