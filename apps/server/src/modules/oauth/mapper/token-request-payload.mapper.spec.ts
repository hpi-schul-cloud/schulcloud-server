import { systemFactory } from '@shared/testing';
import { OauthConfig } from '@shared/domain';
import { TokenRequestParams } from '../controller/dto/token-request.params';
import { TokenRequestPayload } from '../controller/dto/token-request.payload';
import { TokenRequestParamsMapper } from './token-request-params.mapper';
import { TokenRequestPayloadMapper } from './token-request-payload.mapper';

const defaultdecryptedClientSecret = 'mocksecret';
const expectedParams: TokenRequestParams = {
	code: '43534543jnj543342jn2',
	client_id: '12345',
	client_secret: 'mocksecret',
	grant_type: 'authorization_code',
	redirect_uri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId/token',
};
const defaultAuthCode = '43534543jnj543342jn2';
const defaultOauthConfig: OauthConfig = systemFactory.withOauthConfig().build().oauthConfig as OauthConfig;

describe('TokenRequestPayload.Mapper', () => {
	const expectedPayload: TokenRequestPayload = {
		tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
		tokenRequestParams: expectedParams,
	};

	describe('token-request-payload', () => {
		describe('mapToResponse', () => {
			it('should map the Payload to dto', () => {
				const result = TokenRequestPayloadMapper.mapToResponse(
					defaultOauthConfig,
					defaultdecryptedClientSecret,
					defaultAuthCode
				);
				expect(result).toStrictEqual(expectedPayload);
			});
			describe('mapCreateTokenRequestPayload', () => {
				it('should create the Payload', () => {
					const result = TokenRequestPayloadMapper.mapCreateTokenRequestPayload(defaultOauthConfig, expectedParams);
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
				const result = TokenRequestParamsMapper.mapToResponse(
					defaultOauthConfig,
					defaultdecryptedClientSecret,
					defaultAuthCode
				);
				expect(result).toStrictEqual(expectedParams);
			});
			describe('mapCreateTokenRequestPayload', () => {
				it('should create the Payload', () => {
					const result = TokenRequestParamsMapper.mapCreateTokenRequestParams(
						defaultOauthConfig,
						defaultdecryptedClientSecret,
						defaultAuthCode
					);
					expect(result).toStrictEqual(expectedParams);
				});
			});
		});
	});
});
