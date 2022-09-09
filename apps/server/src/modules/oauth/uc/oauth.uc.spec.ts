/* eslint-disable @typescript-eslint/unbound-method */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { Configuration } from '@hpi-schul-cloud/commons';
import { OauthConfig, Role, School, System, User } from '@shared/domain';
import { schoolFactory, systemFactory } from '@shared/testing';
import { Collection } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { AuthorizationParams } from '@src/modules/oauth/controller/dto/authorization.params';
import { IJwt } from '@src/modules/oauth/interface/jwt.base.interface';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { OAuthResponse } from '../service/dto/oauth.response';
import { OAuthService } from '../service/oauth.service';
import { OauthUc } from '.';
import resetAllMocks = jest.resetAllMocks;

jest.mock('jwks-rsa', () => {
	return () => ({
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'alg',
			getPublicKey: jest.fn().mockReturnValue('publicKey'),
			rsaPublicKey: 'publicKey',
		}),
		getSigningKeys: jest.fn(),
	});
});

describe('OAuthUc', () => {
	let uc: OauthUc;
	let oauthService: DeepMocked<OAuthService>;

	let defaultSystem: System;
	let defaultOauthConfig: OauthConfig;

	let defaultAuthCode: string;
	let defaultQuery: AuthorizationParams;
	let defaultErrorQuery: AuthorizationParams;
	let defaultScool: School;
	let defaultDecodedJWT: IJwt;

	let defaultUser: User;
	let defaultJWT: string;
	let defaultTokenResponse: OauthTokenResponse;

	let defaultResponse: OAuthResponse;
	let defaultErrorRedirect: string;
	let defaultErrorResponse: OAuthResponse;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				OauthUc,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
			],
		}).compile();

		oauthService = await module.get(OAuthService);
		uc = await module.get(OauthUc);
		defaultSystem = systemFactory.withOauthConfig().build();
		defaultOauthConfig = defaultSystem.oauthConfig as OauthConfig;

		defaultAuthCode = '43534543jnj543342jn2';
		defaultQuery = { code: defaultAuthCode };
		defaultErrorQuery = { error: 'oauth_login_failed' };
		defaultScool = schoolFactory.build();
		defaultDecodedJWT = {
			sub: '4444',
			uuid: '1111',
		};

		defaultUser = {
			email: '',
			roles: new Collection<Role>([]),
			school: defaultScool,
			_id: new ObjectId(),
			id: '4444',
			createdAt: new Date(),
			updatedAt: new Date(),
			ldapId: '1111',
			firstName: 'Test',
			lastName: 'Testmann',
		};
		defaultJWT =
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMTIzIn0.H_iI0kYNrlAUtHfP2Db0EmDs4cH2SV9W-p7EU4K24bI';
		defaultTokenResponse = {
			access_token: 'zzzz',
			refresh_token: 'zzzz',
			id_token: defaultJWT,
		};

		defaultResponse = {
			idToken: defaultJWT,
			logoutEndpoint: 'logoutEndpointMock',
			provider: 'providerMock',
			redirect: '',
		};
		defaultErrorRedirect = `${Configuration.get('HOST') as string}/login?error=${
			defaultErrorQuery.error as string
		}&provider=${defaultOauthConfig.provider}`;
		defaultErrorResponse = new OAuthResponse();
		defaultErrorResponse.errorcode = defaultErrorQuery.error as string;
		defaultErrorResponse.redirect = defaultErrorRedirect;

		oauthService.checkAuthorizationCode.mockReturnValue(defaultAuthCode);
		oauthService.getOauthConfig.mockResolvedValue(defaultOauthConfig);
		oauthService.requestToken.mockResolvedValue(defaultTokenResponse);
		oauthService.validateToken.mockResolvedValue(defaultDecodedJWT);
		oauthService.findUser.mockResolvedValue(defaultUser);
		oauthService.getJwtForUser.mockResolvedValue(defaultJWT);
		oauthService.buildResponse.mockReturnValue(defaultResponse);
		oauthService.getRedirect.mockReturnValue(defaultResponse);
	});

	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('processOAuth', () => {
		it('should do the process', async () => {
			const response = await uc.processOAuth(defaultQuery, defaultSystem.id);
			expect(response.jwt).toStrictEqual(defaultJWT);
		});
		it('should return an error if processOAuth failed', async () => {
			resetAllMocks();
			oauthService.getOauthConfig.mockResolvedValue(defaultOauthConfig);
			oauthService.getOAuthError.mockReturnValue(defaultErrorResponse);
			const errorResponse = await uc.processOAuth(defaultErrorQuery, '');
			expect(errorResponse).toEqual(defaultErrorResponse);
		});
	});
});
