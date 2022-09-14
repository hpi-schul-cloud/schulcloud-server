/* eslint-disable @typescript-eslint/unbound-method */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { getMockRes } from '@jest-mock/express';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, System } from '@shared/domain';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { Logger } from '@src/core/logger';
import { HydraParams } from '@src/modules/oauth/controller/dto/hydra.params';
import { HydraOauthUc } from '@src/modules/oauth/uc';
import { Request } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams } from './dto/authorization.params';
import { OauthSSOController } from './oauth-sso.controller';

describe('OAuthController', () => {
	let module: TestingModule;
	let controller: OauthSSOController;
	let oauthUc: DeepMocked<OauthUc>;
	let hydraOauthUc: DeepMocked<HydraOauthUc>;

	const mockHost = 'https://mock.de';
	const defaultJWT = 'JWT_mock';
	const iservRedirectMock = `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${mockHost}/dashboard`;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [OauthSSOController],
			providers: [
				{
					provide: OauthUc,
					useValue: createMock<OauthUc>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: HydraOauthUc,
					useValue: createMock<HydraOauthUc>(),
				},
			],
		}).compile();

		controller = module.get(OauthSSOController);
		oauthUc = module.get(OauthUc);
		hydraOauthUc = module.get(HydraOauthUc);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('startOauthAuthorizationCodeFlow', () => {
		const defaultAuthCode = '43534543jnj543342jn2';
		const query: AuthorizationParams = { code: defaultAuthCode };
		const system: System = systemFactory.build();
		system.id = '4345345';

		it('should redirect to mock.de', async () => {
			const { res } = getMockRes();
			oauthUc.processOAuth.mockResolvedValue({
				jwt: '1111',
				idToken: '2222',
				logoutEndpoint: 'https://iserv.n21.dbildungscloud.de/iserv/auth/logout',
				redirect: `logoutEndpointMock?id_token_hint=${defaultJWT}&post_logout_redirect_uri=${mockHost}/dashboard`,
				provider: 'iserv',
			});

			await controller.startOauthAuthorizationCodeFlow(query, res, system.id);

			const expected = [query, system.id];
			expect(oauthUc.processOAuth).toHaveBeenCalledWith(...expected);
			expect(res.cookie).toBeCalledWith('jwt', '1111');
			expect(res.redirect).toBeCalledWith(iservRedirectMock);
		});

		it('should redirect to empty string', async () => {
			const { res } = getMockRes();
			oauthUc.processOAuth.mockResolvedValue({
				idToken: '2222',
				redirect: '',
				provider: 'iserv',
			});

			await controller.startOauthAuthorizationCodeFlow(query, res, system.id);

			expect(res.cookie).toBeCalledWith('jwt', '');
			expect(res.redirect).toBeCalledWith('');
		});
	});

	describe('getHydraOauthToken', () => {
		it('should call the hydraOauthUc', async () => {
			const authParams: AuthorizationParams = {
				code: 'code',
			};
			const hydraParams: HydraParams = {
				oauthClientId: 'clientId',
			};

			await controller.getHydraOauthToken(authParams, hydraParams);

			expect(hydraOauthUc.getOauthToken).toBeCalledWith(authParams, hydraParams.oauthClientId);
		});
	});

	describe('requestAuthToken', () => {
		it('should call the hydraOauthUc', async () => {
			const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
			const request: Request = {
				headers: { authorization: 'Bearer token123' },
			} as Request;

			const hydraParams: HydraParams = {
				oauthClientId: 'clientId',
			};

			await controller.requestAuthToken(currentUser, request, hydraParams);

			expect(hydraOauthUc.requestAuthCode).toBeCalledWith(
				currentUser.userId,
				expect.any(String),
				hydraParams.oauthClientId
			);
		});
	});
});
