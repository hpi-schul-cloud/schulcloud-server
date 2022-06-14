import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { OauthResponseMapper } from '@src/modules/system/mapper/oauth-response.mapper';
import { OauthResponse } from '@src/modules/system/controller/dto/oauth.response';
import { OauthConfigResponse } from '../controller/dto/oauth-config.response';

describe('oauth-response mapper', () => {
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [OauthResponseMapper]
		}).compile();
	});

	describe('mapFromDtoToResponse', () => {
		it('should map all given dtos', () => {
			// Arrange
			let oauthConfigs: OauthConfigDto[] = [
				systemFactory.build(),
				systemFactory.build({ oauthConfig: { clientId: '22333' } })
			].flatMap(system => system.oauthConfig);

			// Act
			const result: OauthResponse = OauthResponseMapper.mapFromDtoToResponse(oauthConfigs);

			// Assert
			expect(result.data.length).toEqual(oauthConfigs.length);
			for (let i = 0; i < result.data.length; i++) {
				assertOauthConfig(oauthConfigs[i], result.data[i]);
			}
		});
	});

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
});
