import { OauthConfig, System } from '@shared/domain';
import { ObjectId } from 'bson';
import { TokenRequestParams } from '../controller/dto/token-request-params';
import { TokenRequestResponse } from '../controller/dto/token-request-response';
import { TokenRequestParamsMapper } from './token-request-params.mapper';
import { TokenRequestResponseMapper } from './token-request-response.mapper';

const defaultdecryptedClientSecret = 'mocksecret';
const expectedParams: TokenRequestParams = {
	code: '43534543jnj543342jn2',
	client_id: '12345',
	client_secret: 'mocksecret',
	grant_type: 'authorization_code',
	redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
};
const defaultAuthCode = '43534543jnj543342jn2';
const defaultOauthConfig: OauthConfig = {
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
};
const defaultSystem: System = {
	type: 'iserv',
	oauthConfig: defaultOauthConfig,
	id: '',
	_id: new ObjectId(),
	createdAt: new Date(),
	updatedAt: new Date(),
};
describe('TokenRequestResponse.Mapper', () => {
	const expectedResponse: TokenRequestResponse = {
		tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
		tokenRequestParams: expectedParams,
	};

	describe('token-request-response', () => {
		describe('mapToResponse', () => {
			it('should map the Response to dto', () => {
				const result = TokenRequestResponseMapper.mapToResponse(
					defaultSystem,
					defaultdecryptedClientSecret,
					defaultAuthCode
				);
				expect(result).toStrictEqual(expectedResponse);
			});
			describe('mapCreateTokenRequestResponse', () => {
				it('should create the Response', () => {
					const result = TokenRequestResponseMapper.mapCreateTokenRequestResponse(defaultSystem, expectedParams);
					expect(result).toStrictEqual(expectedResponse);
				});
			});
		});
	});
});
describe('TokenRequestParams.Mapper', () => {
	describe('token-request-response', () => {
		describe('mapToResponse', () => {
			it('should map the Response to dto', () => {
				const result = TokenRequestParamsMapper.mapToResponse(
					defaultSystem,
					defaultdecryptedClientSecret,
					defaultAuthCode
				);
				expect(result).toStrictEqual(expectedParams);
			});
			describe('mapCreateTokenRequestResponse', () => {
				it('should create the Response', () => {
					const result = TokenRequestParamsMapper.mapCreateTokenRequestParams(
						defaultSystem,
						defaultdecryptedClientSecret,
						defaultAuthCode
					);
					expect(result).toStrictEqual(expectedParams);
				});
			});
		});
	});
});
