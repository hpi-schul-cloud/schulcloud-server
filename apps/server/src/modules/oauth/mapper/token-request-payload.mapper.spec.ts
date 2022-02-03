import { OauthConfig, System } from '@shared/domain';
import { ObjectId } from 'bson';
import { TokenRequestParams } from '../controller/dto/token-request-params';
import { TokenRequestPayload } from '../controller/dto/token-request-payload';
import { TokenRequestPayloadMapper } from './token-request-payload.mapper';

describe('TokenRequestPayload.Mapper', () => {
	const params: TokenRequestParams = {
		code: '43534543jnj543342jn2',
		client_id: '12345',
		client_secret: 'mocksecret',
		grant_type: 'authorization_code',
		redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
	};
	const expectedPayload: TokenRequestPayload = {
		token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
		tokenRequestParams: params,
	};

	describe('token-request-payload', () => {
		describe('mapToResponse', () => {
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
			it('should create the Payload', () => {
				const result = TokenRequestPayloadMapper.mapToResponse(defaultSystem, defaultAuthCode);
				expect(result).toStrictEqual(expectedPayload);
			});
			describe('mapCreateTokenRequestPayload', () => {
				it('should create the Params for Payload', () => {
					const result = TokenRequestPayloadMapper.mapCreateTokenRequestPayload(defaultSystem, params);
					expect(result).toStrictEqual(expectedPayload);
				});
			});
		});
	});
});
