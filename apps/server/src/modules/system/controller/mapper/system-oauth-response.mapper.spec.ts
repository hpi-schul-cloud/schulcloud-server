import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { OauthConfigResponse } from '../dto/oauth-config.response';
import { PublicSystemListResponse } from '../dto/public-system-list.response';
import { SystemResponseMapper } from './system-response.mapper';

function assertOauthConfig(expected: OauthConfigDto | undefined, actual: OauthConfigResponse | undefined): boolean {
	if (expected != null && actual != null) {
		expect(actual.clientId).toBe(expected.clientId);
		expect(actual.idpHint).toBe(expected.idpHint);
		expect(actual.grantType).toBe(expected.grantType);
		expect(actual.tokenEndpoint).toBe(expected.tokenEndpoint);
		expect(actual.authEndpoint).toBe(expected.authEndpoint);
		expect(actual.responseType).toBe(expected.responseType);
		expect(actual.scope).toBe(expected.scope);
		expect(actual.provider).toBe(expected.provider);
		expect(actual.logoutEndpoint).toBe(expected.logoutEndpoint);
		expect(actual.issuer).toBe(expected.issuer);
		expect(actual.jwksEndpoint).toBe(expected.jwksEndpoint);
		expect(actual.redirectUri).toBe(expected.redirectUri);
		return true;
	}
	return false;
}

describe('oauth-response mapper', () => {
	let module: TestingModule;
	const defaultOauthConfigDto = new OauthConfigDto({
		clientId: '12345',
		clientSecret: 'mocksecret',
		tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
		grantType: 'authorization_code',
		scope: 'openid uuid',
		responseType: 'code',
		authEndpoint: 'mock_authEndpoint',
		provider: 'mock_provider',
		logoutEndpoint: 'mock_logoutEndpoint',
		issuer: 'mock_issuer',
		jwksEndpoint: 'mock_jwksEndpoint',
		redirectUri: 'mock_codeRedirectUri',
	});
	const systemDtoOauth = new SystemDto({
		type: 'oauth',
		url: 'http://mockhost:3030/api/v3/oauth',
		alias: 'Iserv',
		oauthConfig: defaultOauthConfigDto,
	});

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [SystemResponseMapper],
		}).compile();
	});

	describe('mapFromDtoToResponse', () => {
		it('should map all given dtos', () => {
			// Arrange
			const systemDtoLdap = new SystemDto({
				type: 'oauth',
				url: 'http://mockhost:3030/api/v3/oauth',
				alias: 'broker_Iserv',
				displayName: 'Iserv',
				oauthConfig: undefined,
			});
			const oauthSystems = [systemDtoOauth, systemDtoOauth];
			const systems: SystemDto[] = [...oauthSystems, systemDtoLdap];

			// Act
			const result: PublicSystemListResponse = SystemResponseMapper.mapFromDtoToResponse(systems);

			// Assert
			expect(result.data.length).toEqual(systems.length);
			for (let i = 0; i < result.data.length; i += 1) {
				expect(systems[i].type).toEqual(result.data[i].type);
				expect(systems[i].alias).toEqual(result.data[i].alias);
				expect(systems[i].displayName).toEqual(result.data[i].displayName);
				expect(systems[i].url).toEqual(result.data[i].url);
				assertOauthConfig(systems[i].oauthConfig, result.data[i].oauthConfig);
			}
		});
	});

	describe('mapFromOauthConfigDtoToResponse', () => {
		it('should map all given dtos', () => {
			// Act
			const result: OauthConfigResponse = SystemResponseMapper.mapFromOauthConfigDtoToResponse(defaultOauthConfigDto);

			// Assert
			assertOauthConfig(defaultOauthConfigDto, result);
		});
	});
});
