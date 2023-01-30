import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { getMockRes } from '@jest-mock/express';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydra-oauth.uc';
import { Request } from 'express';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OauthUc } from '../uc';
import { AuthorizationParams, SystemUrlParams } from './dto';
import { OauthSSOController } from './oauth-sso.controller';

describe('OAuthController', () => {
	let module: TestingModule;
	let controller: OauthSSOController;
	let oauthUc: DeepMocked<OauthUc>;
	let hydraOauthUc: DeepMocked<HydraOauthUc>;

	const mockHost = 'https://mock.de';
	const dateNow: Date = new Date('2020-01-01T00:00:00.000Z');
	const dateExpires: Date = new Date('2020-01-02T00:00:00.000Z');
	const cookieProperties = {
		expires: dateExpires,
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
	};

	beforeAll(async () => {
		jest.spyOn(Configuration, 'get').mockImplementation((key: string) => {
			switch (key) {
				case 'HOST':
					return mockHost;
				case 'COOKIE__HTTP_ONLY':
					return cookieProperties.httpOnly;
				case 'COOKIE__SAME_SITE':
					return cookieProperties.sameSite;
				case 'COOKIE__SECURE':
					return cookieProperties.secure;
				case 'COOKIE__EXPIRES_SECONDS':
					return 86400000; // One day in ms
				default:
					return 'nonexistent case';
			}
		});
		jest.useFakeTimers();
		jest.setSystemTime(dateNow);

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

	afterAll(async () => {
		await module.close();
		jest.useRealTimers();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('startOauthAuthorizationCodeFlow is called', () => {
		const query: AuthorizationParams = new AuthorizationParams();
		query.code = 'defaultAuthCode';
		const systemParams: SystemUrlParams = new SystemUrlParams();
		systemParams.systemId = 'systemId';

		describe('when a redirect url is defined', () => {
			it('should redirect to the redirect url', async () => {
				const { res } = getMockRes();
				const response: OAuthProcessDto = new OAuthProcessDto({
					provider: 'iserv',
					redirect: 'postLoginRedirect',
				});
				oauthUc.processOAuth.mockResolvedValue(response);

				await controller.startOauthAuthorizationCodeFlow(query, res, systemParams);

				expect(res.redirect).toHaveBeenCalledWith('postLoginRedirect');
			});
		});

		describe('when no redirect url is defined', () => {
			it('should not redirect', async () => {
				const { res } = getMockRes();
				const response: OAuthProcessDto = new OAuthProcessDto({
					idToken: '2222',
					provider: 'iserv',
				});
				oauthUc.processOAuth.mockResolvedValue(response);

				await controller.startOauthAuthorizationCodeFlow(query, res, systemParams);

				expect(res.redirect).not.toHaveBeenCalled();
			});
		});

		describe('when a jwt is defined', () => {
			it('should set a jwt cookie', async () => {
				const { res } = getMockRes();
				const response: OAuthProcessDto = new OAuthProcessDto({
					idToken: '2222',
					provider: 'iserv',
					jwt: 'userJwt',
				});
				oauthUc.processOAuth.mockResolvedValue(response);

				await controller.startOauthAuthorizationCodeFlow(query, res, systemParams);

				expect(res.cookie).toHaveBeenCalledWith('jwt', 'userJwt', cookieProperties);
			});
		});

		describe('when no jwt is defined', () => {
			it('should not set a jwt cookie', async () => {
				const { res } = getMockRes();
				const response: OAuthProcessDto = new OAuthProcessDto({
					idToken: '2222',
					provider: 'iserv',
				});
				oauthUc.processOAuth.mockResolvedValue(response);

				await controller.startOauthAuthorizationCodeFlow(query, res, systemParams);

				expect(res.cookie).not.toHaveBeenCalled();
			});
		});
	});

	describe('getHydraOauthToken', () => {
		it('should call the hydraOauthUc', async () => {
			const authParams: AuthorizationParams = {
				code: 'code',
			};
			const oauthClientId = 'clientId';

			await controller.getHydraOauthToken(authParams, oauthClientId);

			expect(hydraOauthUc.getOauthToken).toBeCalledWith(authParams, oauthClientId);
		});
	});

	describe('requestAuthToken', () => {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
		const oauthClientId = 'clientId';

		it('should call the hydraOauthUc', async () => {
			const request: Request = {
				headers: { authorization: 'Bearer token123' },
			} as Request;

			await controller.requestAuthToken(currentUser, request, oauthClientId);

			expect(hydraOauthUc.requestAuthCode).toBeCalledWith(currentUser.userId, expect.any(String), oauthClientId);
		});

		it('should throw UnauthorizedException', async () => {
			const request: Request = {
				headers: { authorization: '1551 token123' },
			} as Request;

			await expect(controller.requestAuthToken(currentUser, request, '')).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('migrateUser', () => {
		it('should call the OAuthUC ', async () => {
			const { res } = getMockRes();
			const query: AuthorizationParams = new AuthorizationParams();
			query.code = 'defaultAuthCode';
			const systemParams: SystemUrlParams = new SystemUrlParams();
			systemParams.systemId = 'systemId';

			oauthUc.migrateUser.mockResolvedValue({ redirect: `${mockHost}/migration/succeed` });

			await controller.migrateUser({ systemId: 'systemId' }, query, res, systemParams);

			expect(res.redirect).toHaveBeenCalledWith(`${mockHost}/migration/succeed`);
		});
	});
});
