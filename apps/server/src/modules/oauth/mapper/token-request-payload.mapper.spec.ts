import { OauthConfig, System } from '@shared/domain';
import { ObjectId } from 'bson';
import { TokenRequestParams } from '../controller/dto/token-request-params';
import { TokenRequestPayload } from '../controller/dto/token-request-payload';
import { TokenRequestParamsMapper } from './token-request-params.mapper';
import { TokenRequestPayloadMapper } from './token-request-payload.mapper';

const expectedParams: TokenRequestParams = {
	code: '43534543jnj543342jn2',
	client_id: '12345',
	client_secret: 'mocksecret',
	grant_type: 'authorization_code',
	redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
};
const defaultAuthCode = '43534543jnj543342jn2';
const defaultOauthConfig: OauthConfig = {
	client_id: '12345',
	client_secret: 'mocksecret',
	token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
	grant_type: 'authorization_code',
	token_redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
	scope: 'openid uuid',
	response_type: 'code',
	auth_endpoint: 'mock_auth_endpoint',
	auth_redirect_uri: '',
};
const defaultSystem: System = {
	type: 'iserv',
	oauthconfig: defaultOauthConfig,
	id: '',
	_id: new ObjectId(),
	createdAt: new Date(),
	updatedAt: new Date(),
};
describe('TokenRequestPayload.Mapper', () => {
	const expectedPayload: TokenRequestPayload = {
		token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
		tokenRequestParams: expectedParams,
	};

	describe('token-request-payload', () => {
		describe('mapToResponse', () => {
			it('should map the Payload to dto', () => {
				const result = TokenRequestPayloadMapper.mapToResponse(defaultSystem, defaultAuthCode);
				expect(result).toStrictEqual(expectedPayload);
			});
			describe('mapCreateTokenRequestPayload', () => {
				it('should create the Payload', () => {
					const result = TokenRequestPayloadMapper.mapCreateTokenRequestPayload(defaultSystem, expectedParams);
					expect(result).toStrictEqual(expectedPayload);
				});
			});
		});
	});
});
describe('TokenRequestParams.Mapper', () => {
	describe('token-request-payload', () => {
		describe('mapToResponse', () => {
			it('should map the Payload to dto', () => {
				const result = TokenRequestParamsMapper.mapToResponse(defaultSystem, defaultAuthCode);
				expect(result).toStrictEqual(expectedParams);
			});
			describe('mapCreateTokenRequestPayload', () => {
				it('should create the Payload', () => {
					const result = TokenRequestParamsMapper.mapCreateTokenRequestParams(defaultSystem, defaultAuthCode);
					expect(result).toStrictEqual(expectedParams);
				});
			});
		});
	});
});
